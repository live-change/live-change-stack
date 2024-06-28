import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
import Debug from 'debug'
const debug = Debug('services:googleAuthentication')

export const OfflineAccess = definition.model({
  name: "OfflineAccess",
  userItem: {
    userReadAccess: () => true
  },
  properties: {
    scope: {
      type: String,
      validation: ['nonEmpty']
    },
    refreshToken: {
      type: String,
      validation: ['nonEmpty']
    },
    lastUse: {
      type: Date
    },
    lastRefresh: {
      type: Date
    }
  },
  indexes: {
    byUserAndScope: {
      property: ['user', 'scope']
    }
  }
})

definition.view({
  name: 'myOfflineAccessByScope',
  properties: {
    scope: {
      type: String
    }
  },
  returns: {
    type: OfflineAccess
  },
  access: (params, { client, service }) => {
    return !!client.user
  },
  async daoPath({ scope }, { client }) {
    return OfflineAccess.indexObjectPath('byUserAndScope', [client.user, scope])
  }
})

definition.event({
  name: "offlineAccessSaved",
  async execute({ user, refreshToken, timestamp }) {
    await OfflineAccess.create({ id: user, user, refreshToken, lastUse: timestamp })
  }
})

definition.event({
  name: "offlineAccessDeleted",
  async execute({ user }) {
    await OfflineAccess.delete(user)
  }
})

definition.event({
  name: "offlineAccessUsed",
  async execute({ user, timestamp }) {
    await OfflineAccess.update(user, { lastUse: timestamp })
  }
})

definition.event({
  name: "offlineAccessRefreshed",
  async execute({ user, timestamp }) {
    await OfflineAccess.update(user, { lastRefresh: timestamp })
  }
})

definition.event({
  name: "offlineAccessDeleted",
  async execute({ user }) {
    await ApiAccess.delete(user)
  }
})

