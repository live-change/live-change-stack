import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const Balance = definition.model({
  name: "Balance",
  propertyOfAny: {
    readAccessControl: {
      roles: ['owner', 'admin']
    }
  },
  properties: {
    available: config.currencyType,
    amount: config.currencyType,
    lastUpdate: {
      type: Date
    }
  },
})

export { Balance }
