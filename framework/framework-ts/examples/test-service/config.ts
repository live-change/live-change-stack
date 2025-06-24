import { PropertyDefinitionSpecification } from '@live-change/framework'
import definition from './definition.js'

const {
  currencyZero = 0,
  currencyAdd = (...args) => {
    return args.reduce((a, b) => a + b, 0)
  },
  currencyNegate = (value) => -value,
  currencyIsPositive = (value) => value > 0,
  changePossible = (value, change) => {
    return value + change >= 0
  },
  nextRecalculateTime = (value) => null, // no recalculation by default, will be used with vector balances
  recalculate = (value, time) => value, // no recalculation by default, will be used with vector balances

  readerRoles = ['owner', 'admin'],

  createBalanceIfNotExists = true,
} = definition.config

const {
  currencyType = {
    type: Number,
    default: currencyZero
  },
} = definition.config


interface BalanceServiceConfig<T> {
  currencyType: PropertyDefinitionSpecification
  currencyAdd: (...args: T[]) => T
  currencyNegate: (value: T) => T
  currencyIsPositive: (value: T) => boolean
  changePossible: (value: T, change: T) => boolean
  nextRecalculateTime: (value: T) => T | null
  recalculate: (value: T, time: T) => T
  readerRoles: string[]
  currencyZero: T
  createBalanceIfNotExists: boolean  
}

const config: BalanceServiceConfig<number> = {
  currencyType, currencyAdd, changePossible, currencyNegate, currencyZero, currencyIsPositive,
  nextRecalculateTime, recalculate, readerRoles, createBalanceIfNotExists
}

export default config
