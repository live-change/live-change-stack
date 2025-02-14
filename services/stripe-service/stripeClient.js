import stripe from 'stripe'

import config from './config.js'

console.log("STRIPE SECRET KEY", config.secretKey)
const stripeClient = stripe(config.secretKey)

export default stripeClient