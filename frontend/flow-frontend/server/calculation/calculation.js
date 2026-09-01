import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const Session = definition.foreignModel('session', 'Session')

export const Calculation = definition.model({
  name: 'Calculation',
  itemOf: {
    what: Session,
    readAccess: config.readAccess,
    writeAccess: config.writeAccess,
    createAccess: config.writeAccess,
    updateAccess: config.writeAccess,
    deleteAccess: config.writeAccess
  },
  properties: {}
})
