import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

export const Graph = definition.model({
  name: 'Graph',
  propertyOfAny: {
    to: ['owner'],
    ownerTypes: config.ownerTypes,
    readAccess: config.readAccess,
    writeAccess: config.writeAccess,
    singleAccess: config.readAccess,
    listAccess: config.readAccess,
    setAccess: config.writeAccess,
    updateAccess: config.writeAccess,
    resetAccess: config.writeAccess
  },
  properties: {}
})
