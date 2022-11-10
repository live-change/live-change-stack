const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')

const config = definition.config
const {
  contentReaderRoles = ['reader'],
  contentWriterRoles = ['writer']
} = config

const contentProperties = {
  snapshot: {
    type: String
  },
  dependencies: { // automatically generated list of static dependencies(images, documents etc.)
    type: Array,
    of: {
      type: Array // Path - generated with frontend
    }
  }
}

const Content = definition.model({
  name: 'Content',
  propertyOfAny: {
    readAccessControl: {
      roles: contentReaderRoles
    },
    writeAccessControl: {
      roles: contentWriterRoles
    },
  },
  properties: {
    ...contentProperties
  }
})

const AdditionalContent = definition.model({
  name: 'AdditionalContent',
  itemOf: {
    what: Content,
    readAccessControl: {
      roles: contentReaderRoles
    },
    writeAccessControl: {
      roles: contentWriterRoles
    }
  },
  properties: {
    ...contentProperties
  }
})

const Page = definition.model({
  name: 'Page',
  entity: {
    readAccessControl: {
      roles: contentReaderRoles
    },
    writeAccessControl: {
      roles: contentWriterRoles
    },
  },
})

module.exports = { Content, AdditionalContent, Page }
