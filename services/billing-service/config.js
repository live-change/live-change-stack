import definition from './definition.js'

const {
  currency = 'usd',
  denomination = 100,
  minimumTopUp = 1000,
  anyTopUpPrices = [],
  topUpOffers = [],
  baseHref = process.env.BASE_HREF || 'http://localhost:8001',
  topUpSuccessUrl,
  topUpCancelUrl,
  currencyDenomination = {
    usd: 100,
    credits: 1,
    default: 100
  }
} = definition.config

definition.clientConfig = {
  currency,
  denomination,
  minimumTopUp,
  anyTopUpPrices,
  topUpOffers,
  currencyDenomination
}

const config = {
  currency,
  denomination,
  minimumTopUp,
  anyTopUpPrices,
  topUpOffers,
  topUpSuccessUrl: topUpSuccessUrl ?? `${baseHref}/billing/topUpSuccess`,
  topUpCancelUrl: topUpCancelUrl ?? `${baseHref}/billing/topUpCancel`,
  currencyDenomination
}

export default config
