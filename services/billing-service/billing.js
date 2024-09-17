import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const Billing = definition.model({
  name: "Billing",
  userProperty: {
    readAccessControl: {
      roles: ['owner', 'admin']
    }
  },
  properties: {
  },
})

export { Billing }
