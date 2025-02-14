import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
import Debug from 'debug'
import { getTokensWithCode, getUserInfo } from './googleClient.js'
import { Account } from './account.js'
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
    },
    account: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  indexes: {
    byUserAndScope: {
      multi: true,
      property: ['user', 'scopes']
    },
    byUser: {
      property: 'user'
    },
    byUserAccount: {
      property: ['user', 'account']
    }
  }
})

definition.view({
  name: 'myUserOfflineAccessByScope',
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

definition.view({
  name: 'userOfflineAccessByScope',
  properties: {
    user: {
      type: String
    },
    scope: {
      type: String
    }
  },
  returns: {
    type: OfflineAccess
  },
  internal: true,
  async daoPath({ user, scope }, { client }) {
    return OfflineAccess.indexObjectPath('byUserAndScope', [user, scope])
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
    if(!tokens.refresh_token) throw new Error("No refresh token")
    const scopes = tokens.scope.split(' ')
    if(tokens.token_type !== 'Bearer') throw new Error("Invalid token type "+tokens.token_type)
    const googleUser = await getUserInfo(tokens.access_token)
    console.log("GOOGLE USER", googleUser)
    const account = googleUser.sub
    const accountData = await Account.get(account)
    console.log("ACCOUNT DATA", accountData, 'CURRENT USER', user)
    if(accountData) {
      if(accountData.user !== user) throw 'connectedToAnotherUser'
    } else {
      await service.trigger({ type: 'connectGoogle' }, {
        user, account, data: googleUser,
      })
      console.log("CONNECTED")
    }
    await OfflineAccess.update(user, {
      id: user,
      user,
      scopes,
      account,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      accessTokenExpire: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      lastRefresh: new Date()
    })
    console.log("OFFLINE ACCESS SAVED")
    await service.triggerService({ type: 'googleAuthentication_setOfflineAccess', service: definition.name }, {
      user, scopes, account,
      accessToken: tokens.access_token,
      accessTokenExpire: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      refreshToken: tokens.refresh_token,
    })
    console.log("TRIGGER other services")
    await service.trigger({ type: 'googleOfflineAccessGained' }, {
      user, scopes,
      accessToken: tokens.access_token,
      accessTokenExpire: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      refreshToken: tokens.refresh_token,
    })
    console.log("TRIGGER FINISHED")
    return {
      action: 'addOfflineAccessToken'
    }
  }
})