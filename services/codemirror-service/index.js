import App from '@live-change/framework'
const app = App.app()

import { ChangeSet } from '@codemirror/state'
import { rebaseUpdates } from '@codemirror/collab'

import definition from './definition.js'
const config = definition.config
const {
  readerRoles = ['writer'],
  writerRoles = ['writer'],
  testLatency
} = config

const writerAccessControl = {
  roles: writerRoles,
  objects: p => [{ objectType: p.targetType, object: p.target }]
}

const readerAccessControl = {
  roles: readerRoles,
  objects: p => [{ objectType: p.targetType, object: p.target }]
}

import { Document, StepsBucket, Snapshot, documentTypes, getDocument } from "./model.js"

const sleep = ms => new Promise(r => setTimeout(r, ms))

definition.view({
  name: 'steps',
  accessControl: readerAccessControl,
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: StepsBucket
    }
  },
  async daoPath(props, { client, context }) {
    if(testLatency) await sleep(testLatency)
    const { targetType, target } = props
    const document = App.encodeIdentifier([targetType, target])
    const path = StepsBucket.rangePath([document], App.extractRange(props))
    console.log("PATH", path)
    return path
  }
})

definition.view({
  name: 'snapshot',
  accessControl: readerAccessControl,
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    version: {
      type: Number
    }
  },
  async daoPath({ targetType, target, version }, { client, context }) {
    const document = App.encodeIdentifier([targetType, target])
    return Snapshot.path( App.encodeIdentifier([document,version.toFixed().padStart(10, '0')]) )
  }
})

definition.view({
  name: 'snapshots',
  accessControl: readerAccessControl,
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  async daoPath(props, { client, context }) {
    if(testLatency) await sleep(testLatency)
    const { targetType, target } = props
    const document = App.encodeIdentifier([targetType, target])
    return Snapshot.indexRangePath( [document], App.extractRange(props) )
  }
})

definition.action({
  name: 'createDocument',
  accessControl: writerAccessControl,
  waitForEvents: true,
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    type: {
      type: String,
      validation: ['nonEmpty']
    },
    purpose: {
      type: String,
      validation: ['nonEmpty']
    },
    content: {
      type: Object
    }
  },
  queuedBy: (command) => [command.targetType, command.target],
  async execute({ targetType, target, type, purpose, content }, { client, service }, emit) {
    if(testLatency) await sleep(testLatency)
    if(!documentTypes.has(type)) throw new Error(`document type not found: ${type}`)
    const document = App.encodeIdentifier([targetType, target])
    const documentData = await Document.get(document)
    if(documentData) throw new Error('document already exists')
    const contentLines = typeof content === 'string' ? content.split('\n') : content
    emit({
      type: 'documentCreated',
      document, documentType: type, purpose, content: contentLines, lastModified: new Date(), created: new Date()
    })
    return {
      id: document,
      type, purpose, content: contentLines, version: 1
    }
  }
})

definition.action({
  name: 'createDocumentIfNotExists',
  accessControl: writerAccessControl,
  waitForEvents: true,
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    type: {
      type: String,
      validation: ['nonEmpty']
    },
    purpose: {
      type: String,
      validation: ['nonEmpty']
    },
    content: {
      type: Object
    }
  },
  queuedBy: (command) => [command.targetType, command.target],
  async execute({ targetType, target, type, purpose, content }, { client, service }, emit) {
    if(testLatency) await sleep(testLatency)
    if(!documentTypes.has(type)) throw new Error(`document type not found: ${type}`)
    const document = App.encodeIdentifier([targetType, target])
    const documentData = await Document.get(document)
    if(documentData) {
      return documentData
    }
    const contentLines = typeof content === 'string' ? content.split('\n') : content
    emit({
      type: 'documentCreated',
      document, documentType: type, purpose, content: contentLines, lastModified: new Date(), created: new Date()
    })
    return {
      id: document,
      type, purpose, content: contentLines, version: 1
    }
  }
})

definition.action({
  name: 'edit',
  accessControl: writerAccessControl,
  waitForEvents: true,
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
        validation: ['nonEmpty']
    },
    type: {
      type: String,
      validation: ['nonEmpty']
    },
    version: {
      type: Number
    },
    steps: {
      type: Array,
      validation: ['nonEmpty']
    },
    window: {
      type: String,
      validation: ['nonEmpty']
    },
    continuation: {
      type: Boolean
    }
  },
  queuedBy: (command) => [command.targetType, command.target],
  async execute({ targetType, target, type, version, steps, window, continuation }, { client, service }, emit) {
    if(testLatency) await sleep(testLatency)
    if(!documentTypes.has(type)) throw new Error(`document type not found: ${type}`)
    const document = App.encodeIdentifier([targetType, target])
    const openDocument = await getDocument(document, type)
    if(!openDocument) throw new Error('document not found')
    if(version > openDocument.version) {
      return 'rejected'
    }

    let received = steps.map(s => ({
      clientID: s.clientID,
      changes: ChangeSet.fromJSON(s.changes)
    }))

    const serverVersion = openDocument.version
    if(version < serverVersion) {
      const buckets = await StepsBucket.rangeGet([document], {
        gt: version.toFixed().padStart(10, '0'),
        lte: serverVersion.toFixed().padStart(10, '0')
      })
      const intermediateUpdates = []
      for(const bucket of buckets || []) {
        for(const s of bucket.steps) {
          intermediateUpdates.push({
            clientID: s.clientID,
            changes: ChangeSet.fromJSON(s.changes)
          })
        }
      }
      try {
        received = rebaseUpdates(received, intermediateUpdates)
      } catch (err) {
        console.error('codemirror edit rebase failed', err)
        return 'rejected'
      }
    }

    const stepsForEvent = received.map(u => ({
      clientID: u.clientID,
      changes: u.changes.toJSON()
    }))

    const [sessionOrUserType, sessionOrUser] =
      client.user ? ['user_User', client.user] : ['session_Session', client.session]
    if(continuation) {
      //console.log("DOC DATA", documentData)
      //console.log("CONTINUATION", documentData.lastStepsBucket, sessionOrUserType, sessionOrUser)
      if(!openDocument.lastStepsBucket
          || openDocument.lastStepsBucket.sessionOrUserType !== sessionOrUserType
          || openDocument.lastStepsBucket.sessionOrUser !== sessionOrUser
          || openDocument.lastStepsBucket.window !== window) {
        console.log("CONTINUATION IGNORED!!")
        return 'rejected' // ignore, client will rebase
      }
    }
    emit({
      type: 'documentEdited',
      document, documentType: type, version: serverVersion, steps: stepsForEvent, window,
      sessionOrUserType,
      sessionOrUser,
      timestamp: new Date()
    })
    return 'saved'
  }
})

definition.action({
  name: 'takeSnapshot',
  accessControl: writerAccessControl,
  waitForEvents: true,
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    type: {
      type: String,
      validation: ['nonEmpty']
    },
    version: {
      type: Number
    },
  },
  queuedBy: (command) => [command.targetType, command.target],
  async execute({ targetType, target, type, version }, { client, service }, emit) {
    if(!documentTypes.has(type)) throw new Error(`document type not found: ${type}`)
    const document = App.encodeIdentifier([targetType, target])
    const documentData = await getDocument(document, type)
    if(!documentData) throw new Error('document not found')
    if(typeof version != 'number') version = documentData.version
    const snapshot = App.encodeIdentifier([document, version.toFixed().padStart(10, '0')])
    emit({
      type: 'snapshotTaken',
      snapshot,
      document, documentType: type, version
    })
    return snapshot
  }
})

definition.trigger({
  name: 'takeSnapshot',
  waitForEvents: true,
  properties: {
    targetType: {
      type: String,
      validation: ['nonEmpty']
    },
    target: {
      type: String,
      validation: ['nonEmpty']
    },
    documentType: {
      type: String,
      validation: ['nonEmpty']
    },
    version: {
      type: Number
    },
  },
  queuedBy: (command) => [command.targetType, command.target],
  async execute({ targetType, target, documentType, version }, { client, service }, emit) {
    if(!documentTypes.has(documentType)) throw new Error(`document type not found: ${documentType}`)
    const document = App.encodeIdentifier([targetType, target])
    const documentData = await getDocument(document, documentType)
    if(!documentData) throw new Error('document not found')
    if(typeof version != 'number') version = documentData.version
    if(version > documentData.version) throw new Error("version not found")
    const snapshot = App.encodeIdentifier([document, version.toFixed().padStart(10, '0')])
    emit({
      type: 'snapshotTaken',
      snapshot,
      document, documentType, version
    })
    return snapshot
  }
})


export default definition
