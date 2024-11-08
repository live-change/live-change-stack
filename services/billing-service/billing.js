import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const Billing = definition.model({
  name: "Billing",
  userProperty: {
    userReadAccess: () => true,
    readAccessControl: {
      roles: ['owner', 'admin']
    }
  },
  properties: {
  },
})

definition.trigger({
  name: 'createBilling_Billing',
  properties: {
    object: {
      type: Billing
    }
  },
  async execute({ object }, { triggerService }, emit) {
    const ownerInfo = { ownerType: 'billing_Billing', ownerId: object }
    const existingBalance = await app.serviceViewGet('balance', 'ownerOwnedBalance', ownerInfo)
    if(!existingBalance) {
      await triggerService({
        service: 'balance',
        type: 'balance_setOrUpdateOwnerOwnedBalance',
      }, ownerInfo)
    }
  }
})

export { Billing }
