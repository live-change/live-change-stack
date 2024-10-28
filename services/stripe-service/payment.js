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
  cancelUrl: {
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
  async execute({ items, causeType, cause, successUrl, cancelUrl }, { client, service }, emit) {
    console.log("STRIPE SECRET KEY", config.secretKey)
    const payment = app.generateUid()
    const stripeClient = stripe(config.secretKey)
    console.log("URLS", {
      success_url: successUrl ?? (config.checkoutSuccessUrl + '/' + payment),
      cancel_url: cancelUrl ?? (config.checkoutCancelUrl + '/' + payment)
    })
    const session = await stripeClient.checkout.sessions.create({
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
      success_url: successUrl ?? (config.checkoutSuccessUrl + '/' + payment),
      cancel_url: cancelUrl ?? (config.checkoutCancelUrl + '/' + payment)
    })
    emit({
      type: 'PaymentCreated',
      payment,
      data: {
        items, causeType, cause,
        stripeSession: session.id,
        state: 'created'
      }
    })
    return {
      payment,
      stripeSession: session.id,
      redirectUrl: session.url
    }
  }
})

