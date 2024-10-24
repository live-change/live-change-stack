import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

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
  async execute({ value, price, currency }, { trigger, client }, emit) {
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
    return await trigger({
      type: 'startPayment'
    }, {
      causeType: 'billing_topUp',
      cause: client.user, // id of user is identical with id of billing account
    })
  }
})