import App from '@live-change/framework'
const app = App.app()

import Debug from 'debug'
const debug = Debug('services:googleAuthentication')

import { OAuth2Client } from 'google-auth-library'

import user from '@live-change/user-service'

const definition = app.createServiceDefinition({
  name: "googleAuthentication",
  use: [ user ]
})
const config = definition.config

const googleClientId = config.clientId || process.env.GOOGLE_CLIENT_ID
const googleClient = new OAuth2Client(googleClientId)

const User = definition.foreignModel("user", "User")

const googleProperties = {
  email: {
    type: String
  },
  email_verified: {
    type: Boolean
  },
  name: {
    type: String
  },
  given_name: {
    type: String
  },
  family_name: {
    type: String
  },
  picture: {
    type: String
  },
  locale: {
    type: String
  }
}

const Account = definition.model({
  name: "Account",
  properties: {
    ...googleProperties
  },
  userItem: {
    userReadAccess: () => true
  }
})

definition.event({
  name: 'accountConnected',
  properties: {
    account: {
      type: String,
      validation: ['nonEmpty']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    },
    data: {
      type: Object,
      properties: googleProperties,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, account, data }) {
    await Account.create({
      ...data,
      id: account,
      user
    })
  }
})

definition.event({
  name: "accountDisconnected",
  properties: {
    account: {
      type: String,
      validation: ['nonEmpty']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ account }) {
    await Account.delete(account)
  }
})

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
    return service.trigger({
      type: 'signIn',
      user, session
    })
  }
})

async function downloadData(user, data, service) {
  await service.trigger({
    type: 'setIdentification',
    sessionOrUserType: 'user',
    sessionOrUser: user,
    overwrite: false,
    name: data.name,
    givenName: data.given_name,
    firstName: data.given_name,
    familyName: data.family_name,
    lastName: data.family_name,
  })
  if(data.picture) {
    const downloadAndUpdateImage = (async () => {
      const picture = await service.trigger('pictures', {
        type: "createPictureFromUrl",
        ownerType: 'user_User',
        owner: user,
        name: "google-profile-picture",
        purpose: "users-updatePicture-picture",
        url: data.picture,
        cropped: true
      })
      await service.trigger({
        type: 'setIdentification',
        sessionOrUserType: 'user',
        sessionOrUser: user,
        overwrite: false,
        picture
      })
    })
    downloadAndUpdateImage()
  }
  if(data.email_verified) {
    await service.trigger({
      type: 'connectEmail',
      email: data.email,
      user
    })
  }
}

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
  async execute({ user, account, data, transferOwnership }, { service }, emit) {
    const accountData = await Account.get(account)
    if(accountData) {
      if(accountData.user !== user) {
        if(transferOwnership) {
          emit({
            'type': 'userOwnedAccountTransferred',
            account, to: user
          })
          await downloadData(user, data, service)
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
    await service.trigger({
      type: 'googleConnected',
      user, account, data
    })
    await downloadData(user, data, service)
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
    await service.trigger({
      type: 'googleDisconnected',
      user, account
    })
  }
})

definition.action({
  name: "signIn",
  properties: {
    accessToken: {
      type: String
    }
  },
  returns: {
    type: User,
    idOnly: true
  },
  waitForEvents: true,
  async execute({ accessToken }, { client, service }, emit) {
    const ticket = await googleClient.verifyIdToken({
      idToken: accessToken,
      audience: googleClientId
    })
    const googleUser = ticket.getPayload()
    debug("GOOGLE USER", googleUser)
    const account = googleUser.sub
    const existingLogin = await Account.get(account)
    const { session } = client
    if(existingLogin) { /// Sign In
      const { user } = existingLogin
      await service.trigger({
        type: 'signIn',
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
    accessToken: {
      type: String
    }
  },
  returns: {
    type: User,
    idOnly: true
  },
  waitForEvents: true,
  async execute({ accessToken }, { client, service }, emit) {
    const ticket = await googleClient.verifyIdToken({
      idToken: accessToken,
      audience: googleClientId
    })
    const googleUser = ticket.getPayload()
    debug("GOOGLE USER", googleUser)
    const account = googleUser.sub
    const existingLogin = await Account.get(account)
    const { session } = client
    if(existingLogin) { /// Sign In
      throw 'alreadyConnected'
    } else { // Sign up
      const user = app.generateUid()
      await service.trigger({
        type: 'connectGoogle',
        user, account, data: googleUser
      })
      await service.trigger({
        type: 'signUpAndSignIn',
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
    accessToken: {
      type: String
    }
  },
  returns: {
    type: User,
    idOnly: true
  },
  waitForEvents: true,
  async execute({ accessToken }, { client, service }, emit) {
    const ticket = await googleClient.verifyIdToken({
      idToken: accessToken,
      audience: googleClientId
    })
    const googleUser = ticket.getPayload()
    debug("GOOGLE USER", googleUser)
    const account = googleUser.sub
    const existingLogin = await Account.get(account)
    const { session } = client
    if(existingLogin) { /// Sign In
      const { user } = existingLogin
      await service.trigger({
        type: 'signIn',
        user, session
      })
      return {
        action: 'signIn',
        user: existingLogin.user
      }
    } else { // Sign up
      const user = app.generateUid()
      await service.trigger({
        type: 'connectGoogle',
        user, account, data: googleUser
      })
      await service.trigger({
        type: 'signUpAndSignIn',
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
  name: "connectGoogle",
  properties: {
    accessToken: {
      type: String
    },
    transferOwnership: {
      type: Boolean,
      default: false
    }
  },
  async execute({ accessToken, transferOwnership }, { client, service }, emit) {
    const ticket = await googleClient.verifyIdToken({
      idToken: accessToken,
      audience: googleClientId
    })
    const user = client.user
    if(!user) throw 'notAuthorized'
    const googleUser = ticket.getPayload()
    debug("GOOGLE USER", googleUser)
    const account = googleUser.sub
    await service.trigger({
      type: 'connectGoogle',
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
    await service.trigger({
      type: 'disconnectGoogle',
      user, account
    })
  }
})

export default definition
