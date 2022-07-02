const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')
const config = definition.config
const LRU = require('lru-cache')
const { Schema } = require('prosemirror-model')
const { Step } = require('prosemirror-transform')

const Document = definition.model({
  name: 'Document',
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
    document = {
      type: documentData.type,
      content: schema.nodeFromJSON(documentData.content),
      version: documentData.version,
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
    await Document.create({ id: document, type: documentType, purpose, content, created, lastModified, version: 0 })
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
    await Promise.all([
      Document.update(document, {
        content: openDocument.content.toJSON(),
        version: openDocument.version,
        lastModified: timestamp
      }),
      StepsBucket.create({
        id: App.encodeIdentifier([document, openDocument.version.toFixed().padStart(10, '0')]),
        window, sessionOrUserType, sessionOrUser, timestamp: new Date(),
        steps
      })
    ])
  }
})

module.exports = { Document, StepsBucket, schemas }
