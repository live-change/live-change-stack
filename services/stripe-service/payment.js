import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import stripe from "./stripeClient.js"

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
  },
  payerType: {
    type: String,
    validation: ['nonEmpty']
  },
  payer: {
    type: String,
    validation: ['nonEmpty']
  }
}

const Payment = definition.model({
  name: "Payment",
  entity:{
  },
  properties: {
    ...paymentParameters,
    state: {
      type: String,
      options: ['created', 'pending', 'succeeded', 'failed', 'refunded']
    },
    stripeSession: {
      type: String
    },
  },
  indexes: {
  }
})

export { Payment}

definition.trigger({
  name: 'startPayment',
  properties: {
    ...paymentParameters
  },
  waitForEvents:true,
  async execute({ items, causeType, cause, successUrl, cancelUrl, payerType, payer }, { service }, emit) {
    const payment = app.generateUid()
    console.log("URLS", {
      success_url: successUrl ?? (config.checkoutSuccessUrl + '/' + payment),
      cancel_url: cancelUrl ?? (config.checkoutCancelUrl + '/' + payment)
    })
    const metadata = {
      type: 'payment',
      payment
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: 'payment:'+payment,
      // customer: // store stripe customer id ?
      // customer_creation: 'always'
      /// TODO:
      // customer_email: /// get from contacts
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
      invoice_creation: {
        enabled: true
      },
      metadata,
      payment_intent_data: {
        metadata
      },
      mode: 'payment',
      success_url: successUrl ?? (config.checkoutSuccessUrl + '/' + payment),
      cancel_url: cancelUrl ?? (config.checkoutCancelUrl + '/' + payment)
    })
    emit({
      type: 'PaymentCreated',
      payment,
      data: {
        items, causeType, cause, payerType, payer,
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
