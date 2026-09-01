import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

export const Node = definition.model({
  name: 'Node',
  propertyOfAny: {
    to: ['graph', 'logic'],
    // Nested Any ids in Edge index keys exceed LMDB's ~254-char UTF-16 limit
    hashId: true,
    graphTypes: config.graphTypes,
    logicTypes: config.logicTypes,
    readAccess: config.readAccess,
    writeAccess: config.writeAccess,
    singleAccess: config.readAccess,
    listAccess: config.readAccess,
    setAccess: config.writeAccess,
    updateAccess: config.writeAccess,
    resetAccess: config.writeAccess
  },
  properties: {
    position: {
      type: Object,
      properties: {
        x: {
          type: Number,
          default: 0,
          validation: ['number']
        },
        y: {
          type: Number,
          default: 0,
          validation: ['number']
        }
      }
    }
  }
})
