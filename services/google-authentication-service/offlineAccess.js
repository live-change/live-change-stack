import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
import Debug from 'debug'
import { getTokensWithCode, getUserInfo } from './googleClient.js'
const debug = Debug('services:googleAuthentication')

export const OfflineAccess = definition.model({
  name: "OfflineAccess",
  userProperty: {
    userReadAccess: () => true
  },
  properties: {
    scopes: {
      type: Array,
      of: {
        type: String,
        validation: ['nonEmpty']
      },
      validation: ['nonEmpty']
    },
    refreshToken: {
      type: String,
      validation: ['nonEmpty']
    },
    accessToken: {
      type: String
    },
    accessTokenExpire: {
      type: Date
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

definition.action({
  name: 'addOfflineAccessToken',
  properties: {
    code: {
      type: String,
      validation: ['nonEmpty']
    },
    redirectUri: {
      type: String,
      validation: ['nonEmpty']
    },
    scope: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ code, redirectUri, scope }, { client, service }, emit) {
    const user = client.user
    if(!user) throw 'notAuthorized'
    const tokens = await getTokensWithCode(code, redirectUri)
    console.log("TOKENS", tokens)
    const scopes = tokens.scope.split(' ')
    if(tokens.token_type !== 'Bearer') throw new Error("Invalid token type "+tokens.token_type)
    await service.triggerService({ type: 'googleAuthentication_setUserOwnedOfflineAccess', service: definition.name }, {
      user, scopes,
      accessToken: tokens.access_token,
      accessTokenExpire: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      refreshToken: tokens.refresh_token,
    })

    return {
      action: 'addOfflineAccessToken'
    }
  }
})