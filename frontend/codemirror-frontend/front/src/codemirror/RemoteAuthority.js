import { useApi, inboxReader } from '@live-change/vue3-ssr'
import { ref } from 'vue'
import { ChangeSet } from '@codemirror/state'

const updatesThrottle = 100

class RemoteAuthority {
  constructor(appContext, targetType, target, type, options) {
    this.appContext = appContext
    this.api = useApi(appContext)

    this.targetType = targetType
    this.target = target
    this.type = type
    this.options = options

    this.onNewUpdates = []
    this.onResynchronization = []

    this.remoteVersion = undefined
    this.receivedUpdates = []

    this.sentUpdates = []
    this.sentVersion = undefined

    this.waitingForResync = true
    this.blockNextResync = false
    this.pendingRequests = 0

    this.synchronizationState = ref('loading')

    this.api.source.on('connect', () => {
      this.resynchronize()
    })
  }

  resynchronize() {
    if (this.blockNextResync) return
    if (!this.stepsReader) return
    if (
      this.stepsReader.observable.getValue() === undefined ||
      this.stepsReader.observable.getValue().length === this.stepsReader.bucketSize ||
      this.stepsReader.queue.length > 0
    ) {
      this.waitingForResync = true
      this.blockNextResync = true
      return
    }
    this.waitingForResync = false
    this.sentUpdates = []
    this.sentVersion = -1
    if (this.pendingRequests === 0) {
      this.synchronizationState.value = 'saved'
    }
    for (const callback of this.onResynchronization) {
      callback()
    }
  }

  handleUpdates() {
    for (const listener of this.onNewUpdates) listener()
    if (this.receivedUpdates.length > 1000) {
      this.receivedUpdates = this.receivedUpdates.slice(-100)
    }
    this.blockNextResync = false
    if (this.waitingForResync) {
      this.resynchronize()
    }
  }

  async startInboxReader() {
    const inboxPrefix =
      JSON.stringify(JSON.stringify(this.targetType) + ':' + JSON.stringify(this.target)) + ':'
    const identifiers = { targetType: this.targetType, target: this.target }
    this.stepsReader = inboxReader(
      (rawPosition, bucketSize) => {
        const path = ['codemirror', 'steps', { ...identifiers, gt: rawPosition, limit: bucketSize }]
        return path
      },
      message => {
        const modifiedVersion = +message.id.split(':').pop().replace(/"/g, '')
        const originalVersion = modifiedVersion - message.steps.length
        if (originalVersion !== this.remoteVersion) {
          throw new Error('message out of order')
        }
        this.remoteVersion = modifiedVersion
        this.receivedUpdates.push(
          ...message.steps.map(step => ({ update: step, window: message.window }))
        )
        this.handleUpdates()
      },
      inboxPrefix + JSON.stringify(this.remoteVersion.toFixed().padStart(10, '0')),
      {
        bucketSize: 32,
        context: this.appContext
      }
    )
  }

  async loadDocument() {
    const identifier = { targetType: this.targetType, target: this.target }
    // Matches generated propertyOfAny object view (default owner): ownerType + owner
    const documentViewProps = { ownerType: this.targetType, owner: this.target }
    let documentData = await this.api.get(['codemirror', 'document', documentViewProps])
    if (!documentData) {
      documentData = {
        ...identifier,
        type: this.type,
        purpose: this.options?.purpose ?? 'document',
        content: this.options?.initialContent ?? [''],
        version: 1
      }
      documentData =
        await this.api.actions.codemirror.createDocumentIfNotExists(documentData)
    }
    this.remoteVersion = documentData.version
    this.waitingForResync = false
    if (typeof window != 'undefined') {
      await this.startInboxReader()
    }
    return documentData
  }

  async startWithLoadedDocument(documentData) {
    this.remoteVersion = documentData.version
    this.waitingForResync = false
    await this.startInboxReader()
    this.synchronizationState.value = 'loaded'
    return documentData
  }

  dispose() {
    if (this.stepsReader) {
      this.stepsReader.dispose()
    }
  }

  async pushUpdates(version, updates, clientID) {
    if (this.waitingForResync) return
    if (version < this.remoteVersion) return

    const updatesJson = updates.map((update, index) => ({
      version: version + index,
      update: {
        clientID: update.clientID ?? clientID,
        changes: update.changes.toJSON()
      },
      json: JSON.stringify(update.changes.toJSON())
    }))

    if (updatesJson.length === 0) return

    let firstOriginalStepIndex = 0
    let resynchronization = false
    if (version <= this.sentVersion - this.sentUpdates.length) {
      this.waitingForResync = true
      return
    }
    if (version <= this.sentVersion) {
      for (let i = 0; i < updatesJson.length; i++) {
        const step = updatesJson[i]
        const sentStep = this.sentUpdates.find(({ version }) => version === step.version)
        if (sentStep) {
          if (sentStep.json !== step.json) {
            resynchronization = true
            break
          }
          firstOriginalStepIndex = i + 1
        } else break
      }
    }
    updatesJson.splice(0, firstOriginalStepIndex)
    if (resynchronization && this.sentUpdates.length > 0) {
      const firstVersion = updatesJson[0]?.version
      if (typeof firstVersion === 'number') {
        this.sentUpdates = this.sentUpdates.filter(({ version }) => version < firstVersion)
      }
    }
    this.sentUpdates = this.sentUpdates.concat(updatesJson)
    if (this.sentUpdates.length > 200) {
      this.sentUpdates = this.sentUpdates.slice(-100)
    }

    if (updatesJson.length === 0) return

    this.sentVersion = updatesJson[0].version

    if (this.pendingRequests === 0) {
      this.synchronizationState.value = 'saving'
    }

    let result
    try {
      this.pendingRequests++
      result = await this.api.actions.codemirror.edit({
        targetType: this.targetType,
        target: this.target,
        type: this.type,
        version: this.sentVersion,
        steps: updatesJson.map(({ update }) => update),
        window: this.api.windowId,
        continuation: firstOriginalStepIndex > 0
      })
    } finally {
      this.pendingRequests--
    }

    if (result === 'saved') {
      if (this.pendingRequests === 0) {
        this.synchronizationState.value = 'saved'
      }
    } else {
      this.resynchronize()
    }
  }

  updatesSince(version) {
    const firstUpdateVersion = this.remoteVersion - this.receivedUpdates.length
    if (version < firstUpdateVersion) {
      this.receivedUpdates = []
      if (!this.stepsReader) {
        throw new Error('steps reader not initialized')
      }
      this.stepsReader.dispose()
      this.remoteVersion = version
      this.startInboxReader()
      return []
    }
    const versionDiff = version - firstUpdateVersion
    const updatesData = this.receivedUpdates.slice(versionDiff)
    const updates = updatesData.map(data => ({
      changes: ChangeSet.fromJSON(data.update.changes),
      clientID: data.update.clientID
    }))
    return updates
  }
}

export default RemoteAuthority


