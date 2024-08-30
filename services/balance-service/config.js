import definition from './definition.js'

const {
  currencyType = {
    type: Number,
    default: 0
  },
  currencyAdd = (...args) => {
    return args.reduce((a, b) => a + b, 0)
  },
  currencyNegate = (value) => -value,
  changePossible = (value, change) => {
    return value + change >= 0
  },
  nextRecalculateTime = (value) => null, // no recalculation by default, will be used with vector balances
  recalculate = (value, time) => value // no recalculation by default, will be used with vector balances
} = definition.config

const config = {
  currencyType, currencyAdd, changePossible, currencyNegate,
  nextRecalculateTime, recalculate
}

export default config
