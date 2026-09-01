import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

const open = () => true

export const TestRecipe = definition.model({
  name: 'TestRecipe',
  entity: {
    readAccess: open,
    writeAccess: open,
    createAccess: open,
    updateAccess: open,
    deleteAccess: open
  },
  properties: {
    name: {
      type: String
    }
  }
})

export const TestOp = definition.model({
  name: 'TestOp',
  itemOf: {
    what: TestRecipe,
    readAccess: open,
    writeAccess: open,
    createAccess: open,
    updateAccess: open,
    deleteAccess: open
  },
  properties: {
    label: {
      type: String
    }
  }
})

export const TestWire = definition.model({
  name: 'TestWire',
  itemOfAny: {
    to: ['source', 'destination'],
    sourceTypes: ['flowTest_TestOp'],
    destinationTypes: ['flowTest_TestOp'],
    readAccess: open,
    writeAccess: open,
    createAccess: open,
    updateAccess: open,
    deleteAccess: open
  },
  properties: {
    sourcePort: {
      type: String,
      validation: ['nonEmpty']
    },
    destinationPort: {
      type: String,
      validation: ['nonEmpty']
    }
  }
})

export const Unrelated = definition.model({
  name: 'Unrelated',
  entity: {
    readAccess: open,
    writeAccess: open,
    createAccess: open,
    deleteAccess: open
  },
  properties: {
    name: {
      type: String
    }
  }
})
