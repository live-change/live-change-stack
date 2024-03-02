import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

const config = definition.config
const {
  postReaderRoles = ['reader', 'writer'],
  postWriterRoles = ['writer']
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

const Post = definition.model({
  name: 'Post',
  entity: {
    readAccessControl: {
      roles: postReaderRoles
    },
    writeAccessControl: {
      roles: postWriterRoles
    },
  },
  properties: {
    publishedTime: {
      type: Date
    }
  }
})

export { Post }
