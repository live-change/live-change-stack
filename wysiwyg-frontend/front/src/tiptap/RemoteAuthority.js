import { useApi, inboxReader } from '@live-change/vue3-ssr'
import { ref } from 'vue'

import { Step } from "@tiptap/pm/transform"

import Debug from "debug"
const debug = Debug("wysiwyg:collab")

const stepsThrottle = 100

class RemoteAuthority{
  constructor(appContext, targetType, target, type, options) {
    this.appContext = appContext
    this.api = useApi(appContext)

    this.targetType = targetType
    this.target = target
    this.type = type
    this.options = options
    this.onNewSteps = []
    this.onResynchronization = []

    this.remoteVersion = undefined
    this.receivedSteps = []

    this.sentSteps = []
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
    debug("RESYNCHRONIZATION REQUESTED!")
    if(this.blockNextResync) return
    if(!this.stepsReader) return
    debug("BUCKET", this.stepsReader.observable.getValue()?.length, this.stepsReader.bucketSize,
      JSON.stringify(this.stepsReader.observable.getValue()))
    debug("QUEUE", this.stepsReader.queue.length)
    if(this.stepsReader.observable.getValue() === undefined
      || this.stepsReader.observable.getValue().length == this.stepsReader.bucketSize
      || this.stepsReader.queue.length > 0) { /// wait for reader
      this.waitingForResync = true
      this.blockNextResync = true
      debug("WAIT FOR READER")
      return
    }
    debug("RESYNCHRONIZE!")
    this.waitingForResync = false
    this.sentSteps = []
    this.sentVersion = -1

    if(this.pendingRequests == 0) {
      this.synchronizationState.value = 'saved' // will be set to saving after any save attempt
    }
    for(const callback of this.onResynchronization) {
      callback()
    }
  }

  handleSteps() {
    for(const listener of this.onNewSteps) listener()
    if(this.receivedSteps.length > 1000) this.receivedSteps = this.receivedSteps.slice(-100)
    this.blockNextResync = false
    if(this.waitingForResync) {
      this.resynchronize()
    }
  }

  async startInboxReader() {
    const inboxPrefix =  JSON.stringify(JSON.stringify(this.targetType)+':'+JSON.stringify(this.target))+':'
    const identifiers = { targetType: this.targetType, target: this.target }
    console.log("START INBOX READER FROM", this.remoteVersion)
    this.stepsReader = inboxReader(
      (rawPosition, bucketSize) => {
        console.log("RP", rawPosition)
        const positionCounter = (+rawPosition.split(':').pop().replace(/"/g, '')) + 1
        console.log("PC", positionCounter)
        const position = inboxPrefix + JSON.stringify(positionCounter.toFixed().padStart(10, '0'))
        const path = ['prosemirror', 'steps', { ...identifiers , gt: position, limit: bucketSize }]
        console.log("P", path)
        return path
      },
      (message) => {
        debug("MESSAGE!", message, this.remoteVersion)
        const modifiedVersion = +message.id.split(':').pop().replace(/"/g, '')
        const originalVersion = modifiedVersion - message.steps.length
        if(originalVersion != this.remoteVersion) throw new Error("message out of order!")
        this.remoteVersion = modifiedVersion
        this.receivedSteps.push(...message.steps.map(step => ({ step, window: message.window })))
        this.handleSteps()
      },
      inboxPrefix + JSON.stringify((this.remoteVersion - 1).toFixed().padStart(10, '0')),
      {
        bucketSize: 32,
        context: this.appContext
      }
    )
  }

  async loadDocument() {
    debug("LOAD DOCUMENT!")
    const identifier = { targetType: this.targetType, target: this.target }
    let documentData = await this.api.get(['prosemirror', 'document', identifier])
    console.log("DOCUMENT DATA", documentData)
    if(!documentData) {
      documentData = {
        ...identifier,
        type: this.type,
        purpose: this.options?.purpose ?? 'document',
        content: this.options?.initialContent ?? { type: 'doc', content: [ ] },
        version: 1
      }
      documentData = await this.api.actions.prosemirror.createDocumentIfNotExists(documentData)
    }
    this.remoteVersion = documentData.version
    this.waitingForResync = false
    if(typeof window != 'undefined') {
      await this.startInboxReader()
    }
    this.synchronizationState.value = 'loaded'
    return documentData
  }

  async startWithLoadedDocument(documentData) {
    debug("START WITH LOADED DOCUMENT!")
    this.remoteVersion = documentData.version
    this.waitingForResync = false
    await this.startInboxReader()
    this.synchronizationState.value = 'loaded'
    return documentData
  }

  dispose() {
    if(this.stepsReader) {
      this.stepsReader.dispose()
    }
  }

  async receiveSteps(version, steps, clientId) {
    if(this.waitingForResync) return
    debug("RECEIVE STEPS", version, '<', this.remoteVersion)
    if(version < this.remoteVersion) return

    const stepsJson = steps.map((step, index) => ({ version: version + index, step: step.toJSON() }))
    debug("STEPS JSON", stepsJson)

    /// REMOVE DUPLICATED STEPS:
    let firstOriginalStepIndex = 0
    let resynchronization = false
    debug("VERSION", version, "SENT VERSION", this.sentVersion)
    if(version <= this.sentVersion - this.sentSteps.length) {
      debug("STEPS BUFFER OVERFLOW, WAITING FOR RESYNCHRONIZATION")
      this.waitingForResync = true
      return
    }
    if(version <= this.sentVersion) { // found resend, check for duplicated steps
      for(let i = 0; i < stepsJson.length; i++) {
        const step = stepsJson[i]
        const sentStep = this.sentSteps.find(({ version }) => version == step.version)
        if(sentStep) {
          //debug('FOUND SENT STEP WITH THE SAME VERSION', sentStep, '==', step)
          if(sentStep.json != step.json) {
            resynchronization = true
            break
          }
          firstOriginalStepIndex = i + 1
        } else break
      }
    }
    stepsJson.splice(0, firstOriginalStepIndex)
    debug("STEPS JSON AFTER DUPLICATED REMOVAL", stepsJson.length)
    if(resynchronization && this.sentSteps.length > 0) {
      debug("RESYNCHRONIZATION!")
      const firstVersion = stepsJson[0].version
      this.sentSteps = this.sentSteps.filter(({ version }) => version < firstVersion)
    }
    this.sentSteps = this.sentSteps.concat(stepsJson)
    if(this.sentSteps.length > 200) this.sentSteps = this.sentSteps.slice(-100)

    if(stepsJson.length == 0) {
      debug("NOTHING TO SEND")
      return
    }
    this.sentVersion = stepsJson[0].version

    if(this.pendingRequests == 0) this.synchronizationState.value = 'saving'
    let result
    try {
      this.pendingRequests++
      result = await this.api.actions.prosemirror.edit({
        targetType: this.targetType,
        target: this.target,
        type: this.type,
        version: this.sentVersion, steps: stepsJson.map(({step}) => step),
        window: api.windowId,
        continuation: firstOriginalStepIndex > 0
      })
    } finally {
      this.pendingRequests--
    }
    if(result == 'saved') {
      if(this.pendingRequests == 0) this.synchronizationState.value = 'saved'
    } else {
      this.resynchronize()
    }
  }

  stepsSince(version, schema) {
    debug("GET STEPS SINCE", version, this.receivedSteps)
    const firstStepVersion = this.remoteVersion - this.receivedSteps.length
    debug(
      "COLLAB REQUESTED VERSION:", version,
      "  FIRST STEP VERSION:", firstStepVersion,
      "  REMOTE VERSION:", this.remoteVersion
    )
    if(version < firstStepVersion) {
      console.error("COLLAB REQUESTED BACK STEPS!")
      console.info("STARTING TIME TRAVEL!")
      this.receivedSteps = []
      if(!this.stepsReader) throw new Error("steps reader not initialized!")
      this.stepsReader.dispose()
      this.remoteVersion = version
      this.startInboxReader()
      return { steps: [], clientIDs: [] }
    }
    const versionDiff = version - firstStepVersion
    const stepsData = this.receivedSteps.slice(versionDiff)
    console.log("SD", stepsData)
    debug("PARSING STEPS", stepsData.length)
    const steps = stepsData.map(stepData => Step.fromJSON(schema, stepData.step))
    const clientIDs = stepsData.map(stepData => stepData.window)
    return { steps, clientIDs }
  }
}

export default RemoteAuthority
