import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import crypto from "crypto"
import express from "express"
import stripe from "stripe"

definition.endpoint({
  name: 'webhook',
  create() {
    const expressApp = express()
    console.log("create stripe webhook")
    expressApp.get('/', (request, response) => {
      // send information that this is stripe webhook
      response.writeHead(200, { "Content-Type": "text/plain" })
      response.end("STRIPE WEBHOOK!")
    })
    expressApp.post('/', express.raw({type: 'application/json'}), async (request, response) => {
      try {
        const event = stripe.webhooks.constructEvent(request.body, sig, config.webhookSecret)
        console.log("STRIPE WEBHOOK", event)
        await app.triggerService({
          service: 'stripe',
          type: `stripe.${event.type}`
        })
        response.json({ received: true })
      } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
      }
    })
    return expressApp
  }
})
