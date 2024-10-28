import definition from './definition.js'

const {
  secretKey,
  publishableKey,
  webhookSecret,
  baseHref = process.env.BASE_HREF || 'http://localhost:8001',
  checkoutSuccessUrl,
  checkoutCancelUrl
} = definition.config

definition.clientConfig = {
  publishableKey
}

const config = {
  secretKey,
  publishableKey,
  webhookSecret,
  checkoutSuccessUrl: checkoutSuccessUrl ?? `${baseHref}/stripe/success`,
  checkoutCancelUrl: checkoutCancelUrl ?? `${baseHref}/stripe/cancel`
}

export default config
