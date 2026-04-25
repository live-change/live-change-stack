import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config
import LRU from 'lru-cache'
import { ChangeSet, Text } from '@codemirror/state'

const { snapshotAfterSteps = 230, readerRoles = ['writer'] } = config

const documentTypes = new Set(Object.keys(config.documentTypes || {}))

const documentReadAccessControl = {
  roles: readerRoles,
  objects: (p) => [{ objectType: p.ownerType, object: p.owner }]
}

const Document = definition.model({
  name: 'Document',
  propertyOfAny: {
    readAccessControl: documentReadAccessControl
  },
  properties: {
    type: {
      type: String
    },
    purpose: {
      type: String
    },
    version: {
      type: Number
    },
    content: {
      type: Object
    },
    created: {
      type: Date
    },
    lastModified: {
      type: Date
    }
  }
})

const StepsBucket = definition.model({
  name: 'StepsBucket',
  properties: {
    steps: {
      type: Object
    },
    sessionOrUserType: {
      type: String
    },
    sessionOrUser: {
      type: String
    },
    window: {
      type: String
    },
    timestamp: {
      type: Date
    }
  }
})

const Snapshot = definition.model({
  name: 'Snapshot',
  properties: {
    document: {
      type: String
    },
    version: {
      type: Number
    },
    content: {
      type: Object
    },
    timestamp: {
      type: Date
    }
  },
  indexes: {
    list: {
      property: ['document', 'version']
    }
  }
})

const openDocuments = new LRU({
  max: 500,
  maxSize: 10e6,
  sizeCalculation: (value, key) => value.content.length,
  ttl: 1000 * 60 * 5,
})

async function getDocument(documentId, documentType) {
  if(!documentTypes.has(documentType)) throw new Error(`document type not found: ${documentType}`)
  let document = openDocuments.get(documentId)
  if(!document) {
    const documentData = await Document.get(documentId)
    if(!documentData) {
      return null
    }
    const [lastStepsBucket, lastSnapshot] = await Promise.all([
      StepsBucket.rangeGet([documentId], { reverse: true, limit: 1 }).then(x => x?.[0] ?? null),
      Snapshot.rangeGet([documentId], { reverse: true, limit: 1 }).then(x => x?.[0] ?? null)
    ])
    document = {
      type: documentData.type,
      content: Text.of(documentData.content),
      version: documentData.version,
      lastStepsBucket,
      lastSnapshot
    }
    openDocuments.set(documentId, document)
  }
  if(document.type !== documentType) throw new Error("wrong document type!")
  return document
}

definition.event({
  name: "documentCreated",
  async execute({ document, documentType, purpose, content, created, lastModified }) {
    const version = 1
    const contentLines = typeof content === 'string' ? content.split('\n') : content
    await Document.create({ id: document, type: documentType, purpose, content: contentLines, created, lastModified, version })
    await Snapshot.create({ id: App.encodeIdentifier([document, version.toFixed().padStart(10, '0')]),
        document, version, content: contentLines, timestamp: lastModified })
  }
})

definition.event({
  name: "documentEdited",
  async execute({ document, documentType, version, steps, window, sessionOrUserType, sessionOrUser, timestamp }) {
    const openDocument = await getDocument(document, documentType)
    if(!openDocument) throw new Error('critical error - document not found') /// impossible

    if(version !== openDocument.version) {
      throw app.logicError('codemirror_document_edited_version_mismatch')
    }

    const received = steps.map(s => ({
      clientID: s.clientID,
      changes: ChangeSet.fromJSON(s.changes)
    }))

    for(const update of received) {
      openDocument.content = update.changes.apply(openDocument.content)
      openDocument.version++
    }

    const bucket = {
      id: App.encodeIdentifier([document, openDocument.version.toFixed().padStart(10, '0')]),
      window, sessionOrUserType, sessionOrUser, timestamp: new Date(),
      steps: received.map(u => ({ clientID: u.clientID, changes: u.changes.toJSON() }))
    }
    const content = openDocument.content.toJSON()
    openDocument.lastStepsBucket = bucket
    const promises = [
      Document.update(document, {
        content,
        version: openDocument.version,
        lastModified: timestamp
      }),
      StepsBucket.create(bucket)
    ]
    if((openDocument.lastSnapshot?.version ?? 0) < openDocument.version - snapshotAfterSteps) {
      openDocument.lastSnapshot = {
        id: App.encodeIdentifier([document, openDocument.version.toFixed().padStart(10, '0')]),
        document, version: openDocument.version, content, timestamp
      }
      promises.push(Snapshot.create(openDocument.lastSnapshot))
    }
    await Promise.all(promises)
  }
})

async function readVersion(document, documentType, version) {
  const snapshots = await Snapshot.rangeGet([document], {
    reverse: true, limit: 1, lte: version.toFixed().padStart(10, '0')
  })
  const snapshot = snapshots?.[0]
  if(!snapshot) throw app.logicError("not_found")
  let content = Text.of(snapshot.content)
  let current = snapshot.version
  while(current < version) {
    const stepsBuckets = await StepsBucket.rangeGet([document], {
      gt: current.toFixed().padStart(10, '0')
    })
    for(const stepsBucket of stepsBuckets || []) {
      for(const stepJson of stepsBucket.steps) {
        content = ChangeSet.fromJSON(stepJson.changes).apply(content)
        current++
        if(current == version) return {
          content: content.toJSON(),
          timestamp: stepsBucket.timestamp
        }
      }
    }
  }
  return { content: content.toJSON(), timestamp: snapshot?.timestamp ?? null }
}

definition.event({
  name: "snapshotTaken",
  async execute({ snapshot: id, document, documentType, version }) {
    const openDocument = await getDocument(document, documentType)
    if(!openDocument) throw new Error('critical error - document not found') /// impossible
    if(openDocument.version < version)
      throw new Error('critical error - document version is lower than snapshot version') /// impossible
    const existing = await Snapshot.get(id)
    if(existing) return id
    if(openDocument.version == version) {
      const content = openDocument.content.toJSON()
      const snapshot = { id, document, version, content, timestamp: openDocument.lastStepsBucket?.timestamp ?? new Date() }
      await Snapshot.create(snapshot)
      if(!openDocument.lastSnapshot || version > openDocument.lastSnapshot.version) openDocument.lastSnapshot = snapshot
    } else {
      const { content, timestamp } = await readVersion(document, documentType, version)
      const snapshot = { id, document, version, content, timestamp }
      await Snapshot.create(snapshot)
      if(!openDocument.lastSnapshot || version > openDocument.lastSnapshot.version) openDocument.lastSnapshot = snapshot
    }
  }
})

export { Document, StepsBucket, Snapshot, documentTypes, getDocument, readVersion }
