import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import { Billing } from './billing.js'

definition.model({
  name: "TopUp",
  itemOf: {
    what: Billing
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
    }
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
  async execute({ value, price, currency, cancelUrl, successUrl }, { trigger, client }, emit) {
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