const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')
const config = definition.config

const Page = definition.model({
  name: 'Page',
  entity: {
    readAccessControl: {
      roles: ['reader']
    },
    writeAccessControl: {
      roles: ['writer']
    },
  },
  properties: {
    dependencies: { // automatically generated list of static dependencies(images, documents etc.)
      type: Array,
      of: {
        type: Array // Path
      }
    }
  }
})

module.exports = { Page }
