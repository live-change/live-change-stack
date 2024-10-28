import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import { User } from './model.js'
import './authenticator.js'
import './userProperty.js'
import './userItem.js'
import './sessionOrUserProperty.js'
import './sessionOrUserItem.js'
import './contactOrUserProperty.js'
import './contactOrUserItem.js'

const Session = definition.foreignModel('session', 'Session')

definition.trigger({
  name: 'signUp',
  properties: {
    user: {
      type: User
    },
  },
  waitForEvents: true,
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
  waitForEvents: true,
  async execute({ user, session }, { client, service }, emit) {
    const userData = await User.get(user)
    if(!userData) throw 'userNotFound'
    await service.trigger({ type: 'signedIn' }, {
      session, user
    })
    emit({
      type: "signedIn",
      user, session
    })
  }
})

definition.action({
  name: 'signOut',
  waitForEvents: true,
  async execute({ }, { client, service }, emit) {
    if(!client.user) throw "notSignedIn"
    await service.trigger({ type: 'signedOut' }, {
      session: client.session,
      user: client.user
    })
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
  waitForEvents: true,
  async execute({ user, session }, { client, service }, emit) {
    if(!user) {
      user = app.generateUid()
    }
    await service.trigger({ type: 'signedIn' }, {
      session, user
    })
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
  name: 'switchUser',
  properties: {
    to: {
      type: User
    }
  },
  waitForEvents: true,
  access: (params, { client }) => {
    return client.roles && client.roles.includes('admin')
  },
  async execute({ to }, { client, service }, emit) {
    const userData = await User.get(to)
    if(!userData) throw 'userNotFound'
    await service.trigger({ type: 'signedOut' }, {
      session: client.session,
      user: client.user
    })
    emit({
      type: "signedOut",
      user: client.user,
      session: client.session
    })
    const session = client.session
    await service.trigger({ type: 'signedIn' }, {
      session, to
    })
    emit({
      type: "signedIn",
      to, session
    })
  }
})

definition.action({
  name: 'deleteMe',
  properties: {
  },
  access: (params, { client }) => {
    return !!client.user
  },
  waitForEvents: true,
  async execute({ }, { client, service }, emit) {
    const user = client.user
    await service.trigger({ type: 'signedOut' }, {
      session: client.session, user: client.user
    })
    await service.trigger({ type: 'userDeleted' }, {
      user: client.user
    })
    await service.trigger({ type: 'userDeleted'  }, {
      user
    })
    await service.trigger({ type: 'deleteUser_User'  }, {
      object: user
    })
    await service.trigger({ type: 'deleteObject'  }, {
      objectType: 'user_User',
      object: user
    })
    emit([{
      type: "deleted",
      user
    }])
    return user
  }
})

export default definition
