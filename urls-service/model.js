const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')
const config = definition.config
const {
  urlAdminRoles = ['writer']
} = config

const Url = definition.model({
  name: 'Url',
  itemOfAny: {
    readAccessControl: {
      roles: ['reader']
    },
    deleteAAccessControl: {
      roles: urlWriterRoles
    }
  },
  properties: {
    domain: {
      type: String
    },
    path: {
      type: String,
      validation: ['nonEmpty']
    },
    redirect: {
      type: String
    }
  },
  indexes: {
    byUrl: {
      property: ["ownerType", "domain", "path"]
    },

    /// TODO: faster index
  }
})

module.exports = { Url }
