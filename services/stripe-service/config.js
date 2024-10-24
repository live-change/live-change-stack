import definition from './definition.js'

const {
  stripeSecretKey,
  stripePublishableKey,
  stripeWebhookSecret
} = definition.config

definition.clientConfig = {
  stripePublishableKey
}

const config = {
  stripeSecretKey,
  stripePublishableKey,
  stripeWebhookSecret
}

export default config
