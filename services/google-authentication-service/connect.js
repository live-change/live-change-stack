import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import Debug from 'debug'
const debug = Debug('services:googleAuthentication')

import { User, googleProperties, Account } from './account.js'
import { getTokensWithCode, getUserInfo } from './googleClient.js'

import { downloadData } from './downloadData.js'

definition.trigger({
  name: "connectGoogle",
  properties: {
    user: {
      type: User,
      validation: ['nonEmpty']
    },
    account: {
      type: String,
      validation: ['nonEmpty']
    },
    data: {
      type: Object,
      properties: googleProperties,
      validation: ['nonEmpty']
    },
    transferOwnership: {
      type: Boolean,
      default: false
    }
  },
  async execute({ user, account, data, transferOwnership },
                context, emit) {
    const { trigger } = context
    const accountData = await Account.get(account)
    if(accountData) {
      if(accountData.user !== user) {
        if(transferOwnership) {
          emit({
            'type': 'AccountTransferred',
            account, to: user
          })
          await downloadData(user, data, context)
          return
        }
        throw 'alreadyConnectedElsewhere'
      }
      throw 'alreadyConnected'
    }
    emit({
      type: 'accountConnected',
      account, user, data
    })
    await trigger({ type: 'googleConnected'  }, {
      user, account, data
    })
    await downloadData(user, data, context)
  }
})

definition.trigger({
  name: "disconnectGoogle",
  properties: {
    account: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ account }, { client, service }, emit) {
    const accountData = await Account.get(account)
    if(!accountData) throw 'notFound'
    const { user } = accountData
    emit({
      type: 'accountDisconnected',
      account, user
    })
    await service.trigger({ type: 'googleDisconnected'  }, {
      user, account
    })
  }
})


definition.action({
  name: "connectGoogle",
  properties: {
    code: {
      type: String,
      validation: ['nonEmpty']
    },
    redirectUri: {
      type: String,
      validation: ['nonEmpty']
    },
    transferOwnership: {
      type: Boolean,
      default: false
    }
  },
  async execute({ code, redirectUri, transferOwnership }, { client, service }, emit) {
    const user = client.user
    if(!user) throw 'notAuthorized'
    const tokens = await getTokensWithCode(code, redirectUri)
    debug("TOKENS", tokens)
    const googleUser = await getUserInfo(tokens.access_token)
    debug("GOOGLE USER", googleUser)
    const account = googleUser.sub
    await service.trigger({ type: 'connectGoogle' }, {
      user, account, data: googleUser,
      transferOwnership
    })
    return {
      action: 'connectGoogle',
      user
    }
  }
})

definition.action({
  name: "disconnectGoogle",
  properties: {
    account: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ account }, { client, service }, emit) {
    const accountData = await Account.get(account)
    if(!accountData) throw 'notFound'
    const { user } = accountData
    if(user !== client.user) throw 'notAuthorized'
    await service.trigger({ type: 'disconnectGoogle' }, {
      user, account
    })
  }
})
