import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'
import { OP_TYPES } from './ops.js'

export const Wire = definition.model({
  name: 'Wire',
  itemOfAny: {
    to: ['source', 'destination'],
    sourceTypes: OP_TYPES,
    destinationTypes: OP_TYPES,
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
