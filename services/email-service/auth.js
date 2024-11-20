import definition from './definition.js'

const User = definition.foreignModel('user', 'User')

const preFilter = email => email.toLowerCase()

const Email = definition.model({
  name: 'Email',
  properties: {
    email: {
      type: String,
      preFilter,
      validation: ['nonEmpty', 'email']
    }
  },
  userItem: {
    userReadAccess: () => true
  }
})

definition.view({
  name: "userEmails",
  global: true,
  internal: true,
  properties: {
    user: {
      type: String
    }
  },
  returns: {
    type: Object
  },
  async daoPath({ user }) {
    return Email.indexRangePath('byUser', [user])
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
  async execute({ email }) {
    await Email.delete(email)
  }
})

definition.event({
  name: "userDeleted",
  properties: {
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user }) {
    const emails = await Email.indexRangeGet('byUser', user)
    await Promise.all(emails.map(email => Email.delete(email)))
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
  async execute({ email }, context, _emit) {
    const emailData = await Email.get(preFilter(email))
    if(emailData) throw { properties: { email: 'emailTaken' } }
    return true
  }
})

definition.view({
  name: 'getEmail',
  internal: true,
  global: true,
  properties: {
    email: {
      type: String,
      validation: ['nonEmpty', 'email']
    }
  },
  returns: {
    type: Email
  },
  async daoPath({ email }) {
    return Email.path(preFilter(email))
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
  async execute({ user, email }, { service }, emit) {
    if(!email) throw new Error("no email")
    email = preFilter(email)
    const emailData = await Email.get(email)
    if(emailData)  {
      if(emailData.user === user) return false
      throw { properties: { email: 'emailTaken' } }
    }
    await service.trigger({ type: 'contactConnected'  }, {
      contactType: 'email_Email',
      contact: email,
      user
    })
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
    email = preFilter(email)
    const emailData = await Email.get(email)
    if(!emailData) throw { properties: { email: 'notFound' } }
    if(emailData.user !== user) throw { properties: { email: 'notFound' } }
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
  waitForEvents: true,
  async execute({ email, session }, { service }, _emit) {
    email = preFilter(email)
    const emailData = await Email.get(email)
    if(!emailData) throw { properties: { email: 'notFound' } }
    const { user } = emailData
    return service.trigger({ type: 'signIn' }, {
      user, session
    })
  }
})

definition.trigger({
  name: "getConnectedContacts",
  properties: {
    user: {
      type: User,
      validation: ['nonEmpty', 'email']
    }
  },
  async execute({ user }, context, _emit) {
    const emails = await Email.indexRangeGet('byUser', user)
    return emails.map(email => ({ ...email, type: 'email', contact: email.email }))
  }
})

definition.trigger({
  name: 'userDeleted',
  properties: {
    user: {
      type: User
    }
  },
  async execute({ user }, { service }, emit) {
    emit([{
      type: "userDeleted",
      user
    }])
  }
})

export { Email }
