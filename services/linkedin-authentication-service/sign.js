import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import Debug from 'debug'
const debug = Debug('services:linkedinAuthentication')

import { User, linkedinProperties, Account } from './account.js'
import { getTokensWithCode, linkedinClientId, getUserInfo } from './linkedinClient.js'

definition.trigger({
  name: "signInLinkedin",
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
    const linkedinUser = await getUserInfo(tokens.access_token)
    debug("LINKEDIN USER", linkedinUser)
    const account = linkedinUser.sub
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
      throw app.logicError("notFound")
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
    const linkedinUser = await getUserInfo(tokens.access_token)
    debug("LINKEDIN USER", linkedinUser)
    const account = linkedinUser.sub
    const existingLogin = await Account.get(account)
    const { session } = client
    if(existingLogin) { /// Sign In
      throw app.logicError("alreadyConnected")
    } else { // Sign up
      const user = app.generateUid()
      await service.trigger({ type: 'connectLinkedin' }, {
        user, account, data: linkedinUser
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
    const linkedinUser = await getUserInfo(tokens.access_token)
    debug("LINKEDIN USER", linkedinUser)
    const account = linkedinUser.sub
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
      await service.trigger({ type: 'connectLinkedin' }, {
        user, account, data: linkedinUser
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
