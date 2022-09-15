const App = require("@live-change/framework")
const app = App.app()

const definition = require('./definition.js')
const config = definition.config

const { Document, StepsBucket, schemas } = require("./model.js")

const { testLatency } = config
const sleep = ms => new Promise(r => setTimeout(r, ms))

definition.view({
  name: 'document',
  properties: {
    document: {
      type: Document,
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Document
  },
  async daoPath({ document }, { client, context }) {
    if(testLatency) await sleep(testLatency)
    return Document.path( document )
  }
})

definition.view({
  name: 'steps',
  properties: {
    document: {
      type: Document,
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
    const path = StepsBucket.rangePath([props.document], App.extractRange(props))
    console.log("PATH", path)
    return path
  }
})

definition.action({
  name: 'createDocument',
  waitForEvents: true,
  properties: {
    document: {
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
  async execute({ document, type, purpose, content }, { client, service }, emit) {
    if(testLatency) await sleep(testLatency)
    if(!schemas[type]) throw new Error(`schema not found for document type ${type}`)
    const documentData = await Document.get(document)
    if(documentData) throw new Error('document already exists')
    emit({
      type: 'documentCreated',
      document, documentType: type, purpose, content, lastModified: new Date(), created: new Date()
    })
  }
})

definition.action({
  name: 'doSteps',
  waitForEvents: true,
  properties: {
    document: {
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
    }
  },
  queuedBy: (command) => command.client.document,
  async execute({ document, type, version, steps, window }, { client, service }, emit) {
    if(testLatency) await sleep(testLatency)
    if(!schemas[type]) throw new Error(`schema not found for document type ${type}`)
    const documentData = await Document.get(document)
    if(!documentData) throw new Error('document not found')
    if(document.version > version) return 'ignored'
    const [sessionOrUserType, sessionOrUser] =
      client.user ? ['user_User', client.user] : ['session_Session', client.session]
    emit({
      type: 'documentEdited',
      document, documentType: type, version, steps, window,
      sessionOrUserType,
      sessionOrUser,
      timestamp: new Date()
    })
    return 'processed'
  }
})

module.exports = definition
