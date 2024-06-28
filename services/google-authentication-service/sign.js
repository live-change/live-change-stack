import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import Debug from 'debug'
const debug = Debug('services:googleAuthentication')

import { User, googleProperties, Account } from './account.js'
import { getTokensWithCode, googleClientId, getUserInfo } from './googleClient.js'

definition.trigger({
  name: "signInGoogle",
  properties: {
    account: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ account, session }, { service }, _emit) {
    const accountData = await Account.get(account)
    if(!accountData) throw { properties: { email: 'notFound' } }
    const { user } = accountData
    return service.trigger({ type: 'signIn' }, {
      user, session
    })
  }
})

definition.action({
  name: "signIn",
  properties: {
    code: {
      type: String,
      validation: ['nonEmpty']
    },
    redirectUri: {
      type: String,
      validation: ['nonEmpty']
    },
  },
  returns: {
    type: User,
    idOnly: true
  },
  waitForEvents: true,
  async execute({ code, redirectUri }, { client, service }, emit) {
    const tokens = await getTokensWithCode(code, redirectUri)
    debug("TOKENS", tokens)
    const googleUser = await getUserInfo(tokens.access_token)
    debug("GOOGLE USER", googleUser)
    const account = googleUser.sub
    const existingLogin = await Account.get(account)
    const { session } = client
    if(existingLogin) { /// Sign In
      const { user } = existingLogin
      await service.trigger({ type: 'signIn'  }, {
        user, session
      })
      return {
        action: 'signIn',
        user
      }
    } else { // Sign up
      throw 'notFound'
    }
  }
})

definition.action({
  name: "signUp",
  properties: {
    code: {
      type: String,
      validation: ['nonEmpty']
    },
    redirectUri: {
      type: String,
      validation: ['nonEmpty']
    },
  },
  returns: {
    type: User,
    idOnly: true
  },
  waitForEvents: true,
  async execute({ accessToken }, { client, service }, emit) {
    const tokens = await getTokensWithCode(code, redirectUri)
    debug("TOKENS", tokens)
    const googleUser = await getUserInfo(tokens.access_token)
    debug("GOOGLE USER", googleUser)
    const account = googleUser.sub
    const existingLogin = await Account.get(account)
    const { session } = client
    if(existingLogin) { /// Sign In
      throw 'alreadyConnected'
    } else { // Sign up
      const user = app.generateUid()
      await service.trigger({ type: 'connectGoogle' }, {
        user, account, data: googleUser
      })
      await service.trigger({ type: 'signUpAndSignIn' }, {
        user, session
      })
      return {
        action: 'signUp',
        user
      }
    }
  }
})

definition.action({
  name: "signInOrSignUp",
  properties: {
    code: {
      type: String,
      validation: ['nonEmpty']
    },
    redirectUri: {
      type: String,
      validation: ['nonEmpty']
    },
  },
  returns: {
    type: User,
    idOnly: true
  },
  waitForEvents: true,
  async execute({ code, redirectUri }, { client, service }, emit) {
    const tokens = await getTokensWithCode(code, redirectUri)
    debug("TOKENS", tokens)
    const googleUser = await getUserInfo(tokens.access_token)
    debug("GOOGLE USER", googleUser)
    const account = googleUser.sub
    const existingLogin = await Account.get(account)
    const { session } = client
    if(existingLogin) { /// Sign In
      const { user } = existingLogin
      await service.trigger({ type: 'signIn' }, {
        user, session
      })
      return {
        action: 'signIn',
        user: existingLogin.user
      }
    } else { // Sign up
      const user = app.generateUid()
      await service.trigger({ type: 'connectGoogle' }, {
        user, account, data: googleUser
      })
      await service.trigger({ type: 'signUpAndSignIn' }, {
        user, session
      })
      return {
        action: 'signUp',
        user
      }
    }
  }
})
