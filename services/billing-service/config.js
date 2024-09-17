import definition from './definition.js'

const {
  currency = 'USD',
  denomination = 100
} = definition.config

definition.clientConfig = {
  currency,
  denomination
}

const config = {
  currency,
  denomination
}

export default config
