const definition = require('./definition.js')

const User = definition.model({
  name: "User",
  properties: {
    roles: {
      type: Array,
      of: {
        type: String
      }
    }
  },
  indexes: {
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

module.exports = { User, AuthenticatedUser }
