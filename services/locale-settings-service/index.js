import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

const LocaleSettings = definition.model({
  name: 'LocaleSettings',
  sessionOrUserProperty: {
    ownerReadAccess: () => true,
    ownerWriteAccess: () => true,
  },
  properties: {
    locale: {
      type: String,
      validation: ['nonEmpty']
    },
    timeZone: {
      type: String,
      validation: ['nonEmpty']
    },
    language: {
      type: String,
      validation: ['nonEmpty']
    },
    currency: {
      type: String,
      validation: ['nonEmpty']
    }
  }
})

definition.view({
  name: "localeSettings",
  global: true,
  internal: true,
  properties: {
    sessionOrUserType: {
      type: String,
      validation: ['nonEmpty']
    },
    sessionOrUser: {
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Object
  },
  async daoPath({ sessionOrUserType, sessionOrUser }, { client, service }) {
    const owner = [sessionOrUserType, sessionOrUser]
    const id = owner.map(p => JSON.stringify(p)).join(':')
    return LocaleSettings.path(id)
  }
})

export { LocaleSettings }

export default definition
