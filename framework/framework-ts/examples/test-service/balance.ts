import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

type Currency = typeof config.currencyType

import { PropertyOfAny, Model, Property } from '../../src/index.js'

/* @PropertyOfAny({
  readAccessControl: {
    roles: ['owner', 'admin']
  }
}) */
@Model(definition)
class Balance {  
  //@Property(config.currencyType)
  available: Currency

  //@Property(config.currencyType)
  amount: Currency

  //@Property()
  lastUpdate: Date
}


