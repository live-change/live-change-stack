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
    language: {
      type: String
    },
    currency: {
      type: String
    },
    dateTime: {
      type: Object,
      default: undefined,
    },
    list: {
      type: Object,
      default: undefined,
    },
    number: {
      type: Object,
      default: undefined,
    },
    plural: {
      type: Object,
      default: undefined,
    },
    relativeTime: {
      type: Object,
      default: undefined,
    },
    capturedLanguage: {
      type: String
    },
    capturedCurrency: {
      type: String
    },
    capturedDateTime: {
      type: Object
    },
    capturedList: {
      type: Object
    },
    capturedNumber: {
      type: Object
    },
    capturedPlural: {
      type: Object
    },
    capturedRelativeTime: {
      type: Object
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
