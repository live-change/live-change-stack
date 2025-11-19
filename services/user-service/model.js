import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

const User = definition.model({
  name: "User",
  entity: {
    readAccess: ['admin'],
    writeAccess: ['admin'],
    readAllAccess: ['admin']
  },
  properties: {
    roles: {
      type: Array,
      of: {
        type: String
      }
    }
  },
  indexes: {
    byRole: {
      property: ['roles'],
      multi: true
    }
  }
})

definition.event({
  name: "created",
  properties: {
    user: {
      type: User
    }
  },
  async execute({ user }) {
    await User.create({
      id: user
    })
  }
})

const Session = definition.foreignModel('session', 'Session')

const AuthenticatedUser = definition.model({
  name: "AuthenticatedUser",
  sessionProperty: {
  },
  userItem: {
    userReadAccess: () => true
  }
})

definition.event({
  name: "signedIn",
  properties: {
    user: {
      type: User
    },
    session: {
      type: Session
    }
  },
  async execute({ user, session }) {
    await AuthenticatedUser.create({
      id: session,
      user, session
    })
  }
})

definition.event({
  name: "signedOut",
  properties: {
    user: {
      type: User
    },
    session: {
      type: Session
    }
  },
  async execute({ session }) {
    await AuthenticatedUser.delete(session)
  }
})

definition.event({
  name: "deleted",
  properties: {
    user: {
      type: User
    }
  },
  async execute({ user }) {
    const authenticated = await AuthenticatedUser.indexRangeGet('byUser', user)
    await Promise.all([ User.delete(user) ].concat(authenticated.map(auth => AuthenticatedUser.delete(auth))))
  }
})

definition.view({
  name: 'sessionUser',
  properties: {
    session: {
      type: Session
    }
  },
  returns: {
    type: User
  },
  daoPath({ session }) {
    return AuthenticatedUser.path(session)
  }
})

definition.view({
  name: 'usersByRole',
  internal: true,
  properties: {
    role: {
      type: String,
      validation: ['nonEmpty']      
    },
    ...App.rangeProperties
  },
  returns: {
    type: User
  },
  daoPath(params) {
    const { role } = params
    const range = App.extractRange(params)
    if(!range.limit || range.limit > 128) range.limit = 128
    return User.sortedIndexRangePath('byRole', role, range)
  }
})

export { User, Session, AuthenticatedUser }
