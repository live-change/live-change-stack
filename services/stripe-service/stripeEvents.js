import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import stripe from "./stripeClient.js"

import { Payment } from './payment.js'

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
    //console.log('stripeEvent.checkout.session.completed', object)
    const id = object.client_reference_id
    const referenceType = id.slice(0, id.indexOf(':'))
    const referenceId = id.slice(id.indexOf(':') + 1)
    if(referenceType === 'payment') {
      const payment = await Payment.get(referenceId)
      if(!payment) throw new Error('Payment '+referenceId+' not found')
      if(object.payment_status === 'paid') {
        console.log("PAYMENT TO UPDATE", payment)
        await triggerService({
          service: definition.name,
          type: 'stripe_updatePayment'
        }, {
          payment: referenceId,
          state: 'succeeded'
        })
        const triggerData = {
          paymentType: 'stripe_Payment',
          payment: referenceId,
          causeType: payment.causeType,
          cause: payment.cause,
          payerType: payment.payerType,
          payer: payment.payer,
          items: payment.items
        }
        await trigger({
          type: 'paymentSucceeded_'+payment.causeType,
        }, triggerData)
        await trigger({
          type: 'paymentSucceeded',
        }, triggerData)
      } else if(object.payment_status === 'unpaid') {
        await triggerService({
          service: definition.name,
          type: 'stripe_updatePayment'
        }, {
          payment: referenceId,
          state: 'pending'
        })
      }
    } else {
      // Ignore
    }

  }
})


definition.trigger({
  name: 'stripeEvent.checkout.session.expired',
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
    ///console.log('stripeEvent.checkout.session.expired', object)
    const id = object.client_reference_id
    const referenceType = id.slice(0, id.indexOf(':'))
    const referenceId = id.slice(id.indexOf(':') + 1)
    if(referenceType === 'payment') {
      const payment = await Payment.get(referenceId)
      if(!payment) throw new Error('Payment '+referenceId+' not found')
      await triggerService({
        type: 'stripe_updatePayment'
      }, {
        payment: referenceId,
        state: 'failed'
      })
      const triggerData = {
        paymentType: 'stripe_Payment',
        payment: referenceId,
        causeType: payment.causeType,
        cause: payment.cause,
        payerType: payment.payerType,
        payer: payment.payer,
        items: payment.items
      }
      await trigger({
        type: 'paymentFailed_'+payment.causeType,
      }, triggerData)
      await trigger({
        type: 'paymentFailed',
      }, triggerData)
    } else {
      // Ignore
    }

  }
})


definition.trigger({
  name: 'stripeEvent.checkout.session.async_payment_succeeded',
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
    //console.log('stripeEvent.checkout.session.async_payment_succeeded', object)
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
        const triggerData = {
          paymentType: 'stripe_Payment',
          payment: referenceId,
          causeType: payment.causeType,
          cause: payment.cause,
          payerType: payment.payerType,
          payer: payment.payer,
          items: payment.items
        }
        await trigger({
          type: 'paymentSucceeded_'+payment.causeType,
        }, triggerData)
        await trigger({
          type: 'paymentSucceeded',
        }, triggerData)
      } else if(object.payment_status === 'unpaid') {
        await triggerService({
          type: 'stripe_updatePayment'
        }, {
          payment: referenceId,
          state: 'pending'
        })
      }
    } else {
      // Ignore
    }

  }
})


definition.trigger({
  name: 'stripeEvent.checkout.session.async_payment_failed',
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
    //console.log('stripeEvent.checkout.session.async_payment_failed', object)
    const id = object.client_reference_id
    const referenceType = id.slice(0, id.indexOf(':'))
    const referenceId = id.slice(id.indexOf(':') + 1)
    if(referenceType === 'payment') {
      const payment = await Payment.get(referenceId)
      if(!payment) throw new Error('Payment '+referenceId+' not found')
      await triggerService({
        type: 'stripe_updatePayment'
      }, {
        payment: referenceId,
        state: 'failed'
      })
      const triggerData = {
        paymentType: 'stripe_Payment',
        payment: referenceId,
        causeType: payment.causeType,
        cause: payment.cause,
        payerType: payment.payerType,
        payer: payment.payer,
        items: payment.items
      }
      await trigger({
        type: 'paymentFailed_'+payment.causeType,
      }, triggerData)
      await trigger({
        type: 'paymentFailed',
      }, triggerData)
    } else {
      // Ignore
    }

  }
})

definition.trigger({
  name: 'stripeEvent.charge.succeeded',
  properties: {
    data: {
      type: Object,
      properties: {
        object: {
          type: Object
        }
      }
    }
  },
  async execute({ data: { object } }, { triggerService, trigger }, emit) {
    console.log('charge.succeeded', JSON.stringify(object, null, 2))
    if(object.metadata?.type === 'payment') {
      const payment = await Payment.get(object.metadata.payment)
      const triggerData = {
        paymentType: 'stripe_Payment',
        payment: payment.id,
        causeType: payment.causeType,
        cause: payment.cause,
        payerType: payment.payerType,
        payer: payment.payer,
        items: payment.items
      }
      await trigger({
        type: 'chargeCollected_'+payment.causeType
      }, triggerData)
      await trigger({
        type: 'chargeCollected'
      }, triggerData)
    } else {
      // Ignore
    }
  }
})

definition.trigger({
  name: 'stripeEvent.charge.refunded',
  properties: {
    data: {
      type: Object,
      properties: {
        object: {
          type: Object
        }
      }
    }
  },
  async execute({ data: { object } }, { triggerService, trigger }, emit) {
    console.log('charge.refunded', JSON.stringify(object, null, 2))
    if(object.metadata?.type === 'payment') {
      const payment = await Payment.get(object.metadata.payment)
      const triggerData = {
        paymentType: 'stripe_Payment',
        payment: payment.id,
        causeType: payment.causeType,
        cause: payment.cause,
        payerType: payment.payerType,
        payer: payment.payer,
        items: payment.items
      }
      await trigger({
        type: 'chargeRefunded_'+payment.causeType,
      }, triggerData)
      await trigger({
        type: 'chargeRefunded',
      }, triggerData)
    } else {
      // Ignore
    }
  }
})