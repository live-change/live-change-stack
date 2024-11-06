import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import "./payment.js"
import "./stripeEvents.js"
import "./webhook.js"

export default definition
