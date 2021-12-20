const definition = require('./definition.js')

const User = definition.foreignModel('user', 'User')

const Email = definition.model({
  name: 'Email',
  userItem: {
    userReadAccess: () => true
  },
  indexes: {
    byEmail: {
      property: 'email'
    }
  }
})

definition.event({
  name: 'emailConnected',
  properties: {
    email: {
      type: String,
      validation: ['nonEmpty', 'email']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, email }) {
    await Email.create({
      id: email,
      user, email
    })
  }
})

definition.event({
  name: "emailDisconnected",
  properties: {
    email: {
      type: String,
      validation: ['nonEmpty', 'email']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, email }) {
    await Email.delete(email)
  }
})

definition.trigger({
  name: "checkNewEmail",
  properties: {
    email: {
      type: String,
      validation: ['nonEmpty', 'email']
    }
  },
  async execute({ email }, context, emit) {
    const emailData = await Email.get(email)
    if(emailData) throw 'taken'
    return true
  }
})

definition.trigger({
  name: "connectEmail",
  properties: {
    email: {
      type: String,
      validation: ['nonEmpty', 'email']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, email }, { client, service }, emit) {
    if(!email) throw new Error("no email")
    const emailData = await Email.get(email)
    if(emailData) throw 'taken'
    emit({
      type: 'emailConnected',
      user, email
    })
    return true
  }
})

definition.trigger({
  name: "disconnectEmail",
  properties: {
    email: {
      type: String,
      validation: ['nonEmpty', 'email']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, email }, { client, service }, emit) {
    const emailData = await Email.get(email)
    if(!emailData) throw 'notFound'
    emit({
      type: 'emailDisconnected',
      user, email
    })
    return true
  }
})

definition.trigger({
  name: "signInEmail",
  properties: {
    email: {
      type: String
    }
  },
  async execute({ email }, { client, service }, emit) {
    const emailData = await Email.get(email)
    if(!emailData) throw 'emailNotFound'
    const { user } = emailData
    return service.trigger({
      type: 'signIn',
      user, session
    })
  }
})

module.exports = { Email }
