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
  async execute({ items, causeType, cause, successUrl, cancelUrl, payerType, payer }, { service }, emit) {
    console.log("STRIPE SECRET KEY", config.secretKey)
    const payment = app.generateUid()
    const stripeClient = stripe(config.secretKey)
    console.log("URLS", {
      success_url: successUrl ?? (config.checkoutSuccessUrl + '/' + payment),
      cancel_url: cancelUrl ?? (config.checkoutCancelUrl + '/' + payment)
    })
    const session = await stripeClient.checkout.sessions.create({
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

definition.trigger({
  name: 'stripeEvent.checkout.session.completed',
  properties: {
    data: {
      type: Object,
      properties: {
        object: {
          type: Object,
          properties: {
            client_reference_id: {
              type: String,
              validation: ['nonEmpty']
            }
          }
        }
      }
    }
  },
  async execute({ data: { object } }, { triggerService, trigger }, emit) {
    console.log('stripeEvent.checkout.session.completed', object)
    const id = object.client_reference_id
    const referenceType = id.slice(0, id.indexOf(':'))
    const referenceId = id.slice(id.indexOf(':') + 1)
    if(referenceType === 'payment') {
      const payment = await Payment.get(referenceId)
      if(!payment) throw new Error('Payment '+referenceId+' not found')
      if(object.payment_status === 'paid') {
        await triggerService({
          type: 'stripe_updatePayment'
        }, {
          payment: referenceId,
          state: 'succeeded'
        })
        await trigger({
          type: 'paymentSucceeded',
          payment: referenceId
        })
      } else if(object.payment_status === 'unpaid') {
        await triggerService({
          type: 'stripe_updatePayment'
        }, {
          payment: referenceId,
          state: 'pending'
        })
        await trigger({
          type: 'paymentSucceeded',
          payment: referenceId
        })
      }
    } else {
      // Ignore
    }

  }
})
