import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const Agreement = definition.model({
  name: "Agreement",
  sessionOrUserProperty: {
    ownerReadAccess: () => true,
    ownerWriteAccess: () => true,
  },
  properties: {
    ...(
      Object.fromEntries(
        config.agreements
          .map((agreement) => [agreement, {
            type: String,
            softValidation: ['nonEmpty'],
            default: '',
          }])
      )
    ),
    updatedAt: {
      type: Date,
      updated: () => new Date(),
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
})

export { Agreement }