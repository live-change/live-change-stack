import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const Draft = definition.model({
  name: "Draft",
  sessionOrUserProperty: {
    ownerReadAccess: () => true,
    ownerWriteAccess: () => true,
    extendedWith: ['action', 'target']
  },
  properties: {
    source: { // used for comparison of data that is being edited
      type: Object
    },
    data: {
      type: Object,
      validation: ['nonEmpty']
    },
  },
})

export { Draft }