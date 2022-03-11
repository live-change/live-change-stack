const app = require("@live-change/framework").app()
const definition = require('./definition.js')

const { User, AutheticatedUser } = require('./model.js')
require('./authenticator.js')
require('./userProperty.js')
require('./userItem.js')
require('./sessionOrUserProperty.js')
require('./sessionOrUserItem.js')

const Session = definition.foreignModel('session', 'Session')

definition.trigger({
  name: 'signUp',
  properties: {
    user: {
      type: User
    },
  },
  async execute({ user }, { client, service }, emit) {
    if(!user) {
      user = app.generateUid()
    }
    emit({
      type: "created",
      user
    })
    return user
  }
})

definition.trigger({
  name: 'signIn',
  properties: {
    user: {
      type: User,
      validation: ['nonEmpty']
    },
    session: {
      type: Session,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, session }, { client, service }, emit) {
    const userData = await User.get(user)
    if(!userData) throw 'userNotFound'
    emit({
      type: "signedIn",
      user, session
    })
  }
})

definition.action({
  name: 'signOut',
  async execute({ }, { client, service }, emit) {
    if(!client.user) throw "notSignedIn"
    emit({
      type: "signedOut",
      user: client.user,
      session: client.session
    })
  }
})

definition.trigger({
  name: 'signUpAndSignIn',
  properties: {
    user: {
      type: User
    },
    session: {
      type: Session,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, session }, { client, service }, emit) {
    if(!user) {
      user = app.generateUid()
    }
    emit([{
      type: "created",
      user
    },{
      type: "signedIn",
      user, session
    }])
    return user
  }
})

definition.action({
  name: 'deleteMe',
  properties: {
  },
  access: (params, { client }) => {
    return !!client.user
  },
  async execute({ }, { client, service }, emit) {
    const user = client.user
    await service.trigger({
      type: 'userDeleted',
      user
    })
    emit([{
      type: "deleted",
      user
    }])
    return user
  }
})

module.exports = definition
