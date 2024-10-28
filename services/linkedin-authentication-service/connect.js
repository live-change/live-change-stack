import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import Debug from 'debug'
const debug = Debug('services:linkedinAuthentication')

import { User, linkedinProperties, Account } from './account.js'
import { getTokensWithCode, getUserInfo } from './linkedinClient.js'

import { downloadData } from './downloadData.js'

definition.trigger({
  name: "connectLinkedin",
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
      properties: linkedinProperties,
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
            'type': 'userOwnedAccountTransferred',
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
    await trigger({ type: 'linkedinConnected'  }, {
      user, account, data
    })
    await downloadData(user, data, context)
  }
})

definition.trigger({
  name: "disconnectLinkedin",
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
    await service.trigger({ type: 'linkedinDisconnected'  }, {
      user, account
    })
  }
})


definition.action({
  name: "connectLinkedin",
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

    const [linkedinUser, linkedinEmail] = await Promise.all([
      getUserInfo(tokens.access_token),
      getUserEmail(tokens.access_token)
    ])

    debug("LINKEDIN USER", linkedinUser)
    debug("LINKEDIN EMAIL", linkedinEmail)

    console.log("LINKEDIN USER", linkedinUser)
    console.log("LINKEDIN EMAIL", linkedinEmail)
    process.exit(1)

    const account = linkedinUser.sub
    await service.trigger({ type: 'connectLinkedin' }, {
      user, account, data: linkedinUser,
      transferOwnership
    })
    return {
      action: 'connectLinkedin',
      user
    }
  }
})

definition.action({
  name: "disconnectLinkedin",
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
    await service.trigger({ type: 'disconnectLinkedin' }, {
      user, account
    })
  }
})
