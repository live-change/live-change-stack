import definition from './definition.js'

const {
  currency = 'usd',
  denomination = 100,
  minimumTopUp = 1000,
  anyTopUpPrices = [],
  topUpOffers = []
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
  topUpOffers
}

export default config
