import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'
import { Calculation } from './calculation.js'

const access = {
  readAccess: config.readAccess,
  writeAccess: config.writeAccess,
  createAccess: config.writeAccess,
  updateAccess: config.writeAccess,
  deleteAccess: config.writeAccess
}

export const Constant = definition.model({
  name: 'Constant',
  itemOf: {
    what: Calculation,
    ...access
  },
  properties: {
    value: {
      type: Number,
      default: 1,
      validation: ['number']
    }
  }
})

export const Add = definition.model({
  name: 'Add',
  itemOf: {
    what: Calculation,
    ...access
  },
  properties: {}
})

export const Multiply = definition.model({
  name: 'Multiply',
  itemOf: {
    what: Calculation,
    ...access
  },
  properties: {}
})

export const Power = definition.model({
  name: 'Power',
  itemOf: {
    what: Calculation,
    ...access
  },
  properties: {
    exponent: {
      type: Number,
      default: 2,
      validation: ['number']
    }
  }
})

export const OP_TYPES = [
  'calculation_Constant',
  'calculation_Add',
  'calculation_Multiply',
  'calculation_Power'
]
