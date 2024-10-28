import definition from './definition.js'

const {
  currency = 'usd',
  denomination = 100,
  minimumTopUp = 1000,
  anyTopUpPrices = [],
  topUpOffers = [],
  baseHref = process.env.BASE_HREF || 'http://localhost:8001',
  topUpSuccessUrl,
  topUpCancelUrl
} = definition.config

definition.clientConfig = {
  currency,
  denomination,
  minimumTopUp,
  anyTopUpPrices,
  topUpOffers
}

const config = {
  currency,
  denomination,
  minimumTopUp,
  anyTopUpPrices,
  topUpOffers,
  topUpSuccessUrl: topUpSuccessUrl ?? `${baseHref}/billing/topUpSuccess`,
  topUpCancelUrl: topUpCancelUrl ?? `${baseHref}/billing/topUpCancel`
}

export default config
