import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import stripe from 'stripe'

const itemsArray = {
    type: Array,
    of: {
      type: Object,
      properties: {
        name: {
          type: String,
          validation: ['nonEmpty']
        },
        price: {
          type: Number,
          validation: ['nonEmpty', 'number']
        },
        currency: {
          type: String,
          validation: ['nonEmpty']
        },
        quantity: {
          type: Number,
          validation: ['nonEmpty', 'number']
        },
        description: {
          type: String
        },
        taxCode: {
          type: String
        }
      }
    }
  }

const paymentParameters = {
  items: itemsArray,
  causeType: {
    type: String,
    validation: ['nonEmpty']
  },
  cause: {
    type: String,
    validation: ['nonEmpty']
  },
  successUrl: {
    type: String,
    validation: ['nonEmpty']
  },
  returnUrl: {
    type: String,
    validation: ['nonEmpty']
  }
}

definition.model({
  name: "Payment",
  entity:{
  },
  properties: {
    ...paymentParameters,
    state: {
      type: String,
      options: ['created', 'succeeded', 'failed', 'refunded']
    },
    stripeSession: {
      type: String
    },
  },
  indexes: {
  }
})

definition.trigger({
  name: 'startPayment',
  properties: {
    ...paymentParameters
  },
  async execute({ items, causeType, cause, successUrl, returnUrl }, { client, service }, emit) {
    const stripe = stripe(config.stripeSecretKey)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: item.currency,
          product_data: {
            name: item.name,
            description: item.description,
            tax_code: item.taxCode
          },
          unit_amount: item.price
        },
        quantity: item.quantity
      })),
      mode: 'payment',
      success_url: successUrl,
      return_url: returnUrl
    })
    emit({
      type: 'PaymentCreated',
      data: {
        items, causeType, cause, successUrl, returnUrl,
        stripeSession: session.id,
        state: 'created'
      }
    })
    return session
  }
})

