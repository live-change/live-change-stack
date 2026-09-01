import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

export const Edge = definition.model({
  name: 'Edge',
  itemOfAny: {
    to: ['graph', 'source', 'destination', 'connection'],
    graphTypes: config.graphTypes,
    sourceTypes: config.nodeTypes,
    destinationTypes: config.nodeTypes,
    connectionTypes: config.connectionTypes,
    readAccess: config.readAccess,
    writeAccess: config.writeAccess,
    createAccess: config.writeAccess,
    updateAccess: config.writeAccess,
    deleteAccess: config.writeAccess
  },
  properties: {
    sourcePort: {
      type: String,
      validation: ['nonEmpty']
    },
    destinationPort: {
      type: String,
      validation: ['nonEmpty']
    }
  }
})
