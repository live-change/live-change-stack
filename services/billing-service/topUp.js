import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import { Billing } from './billing.js'

const TopUp = definition.model({
  name: "TopUp",
  itemOf: {
    what: Billing,
    readAccessControl: {
      roles: ['owner', 'admin']
    }
  },
  properties: {
    value: {
      type: Number
    },
    price: {
      type: Number
    },
    currency: {
      type: String
    },
    state: {
      type: String,
      options: ['created', 'paid', 'failed', 'refunded'],
      default: 'created'
    },
  }
})

definition.view({
  name: "topUp",
  properties: {
    topUp: {
      type: TopUp
    }
  },
  returns: {
    type: TopUp
  },
  accessControl: {
    roles: ['owner'],
    objects: (props) => [{
      objectType: definition.name + '_TopUp',
      object: props.topUp
    }]
  },
  async daoPath({ topUp }, { client, service }, method) {
    return TopUp.path(topUp)
  }
})

definition.action({
  name: "topUp",
  properties: {
    value: {
      type: Number
    },
    price: {
      type: Number
    },
    currency: {
      type: String
    }
  },
  returns: {
    type: Object
  },
  async execute({ value, price, currency, cancelUrl, successUrl }, { trigger, triggerService, client }, emit) {
    const offer = config.topUpOffers
      ?.find(offer => (offer.currency === currency) && (offer.price === price) && (offer.value === value))
    const anyTopUpPrice = config?.anyTopUpPrices
      ?.find(price => price.currency === currency)
    if(!offer && !anyTopUpPrice) {
      throw new Error("Invalid top up offer")
    }
    if(!offer) { // check if price is valid
      if(!anyTopUpPrice.minPrice && offer.price < anyTopUpPrice.minPrice) {
        throw new Error("Price is too low")
      }
      if(!anyTopUpPrice.maxPrice && offer.price > anyTopUpPrice.maxPrice) {
        throw new Error("Price is too high")
      }
      if(BigInt(price) * BigInt(anyTopUpPrice.value) / BigInt(value) < BigInt(anyTopUpPrice.price) ) {
        throw new Error("Price is too low for this value")
      }
    }
    const billing = client.user // billing is user property
    const billingData = await Billing.get(billing)
    if(!billingData) { // billing not found, create billing with first top up
      await triggerService({
        service: definition.name,
        type: 'billing_setOrUpdateUserOwnedBilling'
      }, {
        user: client.user
      })
    }
    const topUp = app.generateUid()
    emit({
      type: 'billingOwnedTopUpCreated',
      topUp, data: { value, price, currency }, identifiers: { billing }
    })
    const triggerResult = (await trigger({
      type: 'startPayment'
    }, {
      causeType: 'billing_TopUp',
      cause: topUp,
      payerType: 'user_User',
      payer: client.user,
      items: [{
        name: 'Top Up ',
        price: price,
        currency: currency,
        quantity: 1
      }],
      successUrl: config.topUpSuccessUrl + '/' + topUp.replace(/\[/g, '(').replace(/]/g, ')'),
      cancelUrl: config.topUpCancelUrl + '/' + topUp.replace(/\[/g, '(').replace(/]/g, ')'),
    }))?.[0]
    if(!triggerResult) {
      throw new Error("No payment service available")
    }
    console.log("TRIGGER RESULT", triggerResult)
    return triggerResult
  }
})

definition.trigger({
  name: 'chargeCollected_billing_TopUp',
  properties: {
    paymentType: {
      type: String
    },
    payment: {
      type: String
    },
    causeType: {
      type: String
    },
    cause: {
      type: String
    },
    payerType: {
      type: String
    },
    payer: {
      type: String
    },
    items: {
      type: String
    }
  },
  async execute(props, { client, triggerService, trigger }, emit) {
    const { paymentType, payment, causeType, cause, payerType, payer, items } = props
    const topUp = await TopUp.get(cause)
    if(!topUp) throw new Error("TopUp not found")
    if(topUp.state !== 'created') throw new Error("TopUp already processed")
    const balance = App.encodeIdentifier(['billing_Billing', topUp.billing])
    await trigger({
      type: 'balance_doOperation'
    }, {
      balance,
      causeType: 'billing_TopUp',
      cause: topUp.id,
      change: topUp.value
    })
    await triggerService({
      service: definition.name,
      type: 'billing_updateBillingOwnedTopUp'
    }, {
      billing: topUp.billing,
      topUp: topUp.id,
      state: 'paid'
    })
  }
})

definition.trigger({
  name: 'chargeRefunded_billing_TopUp',
  properties: {
    paymentType: {
      type: String
    },
    payment: {
      type: String
    },
    causeType: {
      type: String
    },
    cause: {
      type: String
    },
    payerType: {
      type: String
    },
    payer: {
      type: String
    },
    items: {
      type: String
    }
  },
  async execute(props, { client, triggerService, trigger }, emit) {
    const { paymentType, payment, causeType, cause, payerType, payer, items } = props
    const topUp = await TopUp.get(cause)
    if(!topUp) throw new Error("TopUp not found")
    if(topUp.state !== 'paid') throw new Error("Impossible to refund not paid top up")
    const balance = App.encodeIdentifier(['billing_Billing', topUp.billing])
    await trigger({
      type: 'balance_doOperation'
    }, {
      billing: topUp.billing,
      causeType: 'billing_TopUp',
      cause: topUp.id,
      change: -topUp.value,
      force: true,
    })
    await triggerService({
      service: definition.name,
      type: 'billing_updateBillingOwnedTopUp'
    }, {
      topUp: topUp.id,
      state: 'paid'
    })
  }
})

definition.trigger({
  name: 'paymentFailed_billing_TopUp',
  properties: {
    paymentType: {
      type: String
    },
    payment: {
      type: String
    },
    causeType: {
      type: String
    },
    cause: {
      type: String
    },
    payerType: {
      type: String
    },
    payer: {
      type: String
    },
    items: {
      type: String
    }
  },
  async execute(props, { client, triggerService }, emit) {
    const { paymentType, payment, causeType, cause, payerType, payer, items } = props
    const topUp = await TopUp.get(cause)
    if(!topUp) throw new Error("TopUp not found")
    if(topUp.state !== 'created') throw new Error("TopUp already processed")
    if(topUp.state === 'paid') return // ignore, it's already paid
    await triggerService({
      service: definition.name,
      type: 'billing_updateBillingOwnedTopUp'
    }, {
      billing: topUp.billing,
      topUp: topUp.id,
      state: 'failed'
    })
  }
})