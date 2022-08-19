const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')
const config = definition.config
const LRU = require('lru-cache')
const { Schema } = require('prosemirror-model')
const { Step } = require('prosemirror-transform')

const Page = definition.model({
  name: 'Page',
  entity: {
  },
  accessControl: {

  },
  properties: {
  }
})


module.exports = { Document, StepsBucket, schemas }
