import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config
import LRU from 'lru-cache'
import { Schema } from 'prosemirror-model'
import { Step } from 'prosemirror-transform'

const { snapshotAfterSteps = 230 } = config

const Document = definition.model({
  name: 'Document',
  propertyOfAny: {
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

const schemas = {}
for(const typeName in config.documentTypes) {
  const spec = config.documentTypes[typeName]
  schemas[typeName] = new Schema(spec)
}

const openDocuments = new LRU({
  max: 500,
  maxSize: 10e6,
  sizeCalculation: (value, key) => value.content.nodeSize,
  ttl: 1000 * 60 * 5,
})

async function getDocument(documentId, documentType) {
  const schema = schemas[documentType]
  if(!schema) throw new Error(`schema not found for document type ${documentType}`)
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
      content: schema.nodeFromJSON(documentData.content),
      version: documentData.version,
      lastStepsBucket,
      lastSnapshot,
      schema
    }
    openDocuments.set(documentId, document)
  }
  if(document.type != documentType) throw new Error("wrong document type!")
  return document
}

definition.event({
  name: "documentCreated",
  async execute({ document, documentType, purpose, content, created, lastModified }) {
    const version = 1
    await Document.create({ id: document, type: documentType, purpose, content, created, lastModified, version })
    await Snapshot.create({ id: App.encodeIdentifier([document, version.toFixed().padStart(10, '0')]),
        document, version, content, timestamp: lastModified })
  }
})

definition.event({
  name: "documentEdited",
  async execute({ document, documentType, version, steps, window, sessionOrUserType, sessionOrUser, timestamp }) {
    const openDocument = await getDocument(document, documentType)
    if(!openDocument) throw new Error('critical error - document not found') /// impossible
    if(openDocument.version != version) return // ignore, client will rebase
    for(const stepJson of steps) {
      const step = Step.fromJSON(openDocument.schema, stepJson)
      openDocument.content = step.apply(openDocument.content).doc
      openDocument.version ++
    }
    const bucket = {
      id: App.encodeIdentifier([document, openDocument.version.toFixed().padStart(10, '0')]),
      window, sessionOrUserType, sessionOrUser, timestamp: new Date(),
      steps
    }
    //console.log("DOC EDITED", bucket)
    const content =  openDocument.content.toJSON()
    openDocument.lastStepsBucket = bucket
    const promises = [
      Document.update(document, {
        content,
        version: openDocument.version,
        lastModified: timestamp
      }),
      StepsBucket.create(bucket)
    ]
    if(openDocument.lastSnapshot.version < openDocument.version - snapshotAfterSteps) {
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
  const schema = schemas[documentType]
  const snapshot = await Snapshot.rangePath([document], {
    reverse: true, limit: 1, lte: version.toFixed().padStart(10, '0')
  })?.[0]
  if(!snapshot) throw 'not_found'
  let content = schema.nodeFromJSON(snapshot.content)
  let current = snapshot.version
  while(current < version) {
    const stepsBuckets = await StepsBucket.rangePath([document], {
      gt: current.toFixed().padStart(10, '0')
    })
    for(const stepsBucket of stepsBuckets) {
      for(const stepJson of stepsBucket.steps) {
        const step = Step.fromJSON(schemas[snapshot.type], stepJson)
        content = step.apply(content).doc
        current ++
        if(current == version) return {
          content,
          timestamp: stepsBuckets.timestamp
        }
      }
    }
  }
}

definition.event({
  name: "snapshotTaken",
  async execute({ snapshot: id, document, documentType, version }) {
    const openDocument = await getDocument(document, documentType)
    if(!openDocument) throw new Error('critical error - document not found') /// impossible
    if(openDocument.version < version)
      throw new Error('critical error - document version is lower than snapshot version') /// impossible
    const existing = await Snapshot.get(id)
    console.log("SNAP", existing, openDocument.version, version)
    if(existing) return id
    if(openDocument.version == version) {
      const content = openDocument.content
      const snapshot = { id, document, version, content, timestamp: openDocument.lastModified }
      await Snapshot.create(snapshot)
      if(version > openDocument.lastSnapshot.version) openDocument.lastSnapshot = snapshot
    } else {
      const { content, timestamp } = readVersion(document, documentType, version)
      const snapshot = { id, document, version, content, timestamp }
      await Snapshot.create(snapshot)
      if(version > openDocument.lastSnapshot.version) openDocument.lastSnapshot = snapshot
    }
  }
})

export { Document, StepsBucket, Snapshot, schemas, getDocument, readVersion }
