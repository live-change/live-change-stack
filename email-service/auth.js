const { validation } = require('@live-change/framework')
const definition = require('./definition.js')

const User = definition.foreignModel('user', 'User')

const Email = definition.model({
  name: 'Email',
  properties: {
    email: {
      type: String,
      validation: ['nonEmpty', 'email']
    }
  },
  userItem: {
    userReadAccess: () => true
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
    if(emailData) throw { properties: { email: 'taken' } }
    return true
  }
})

definition.trigger({
  name: "getEmail",
  properties: {
    email: {
      type: String,
      validation: ['nonEmpty', 'email']
    }
  },
  async execute({ email }, context, emit) {
    const emailData = await Email.get(email)
    if(!emailData) throw { properties: { email: 'notFound' } }
    return emailData
  }
})

definition.trigger({
  name: "getEmailOrNull",
  properties: {
    email: {
      type: String,
      validation: ['nonEmpty', 'email']
    }
  },
  async execute({ email }, context, emit) {
    const emailData = await Email.get(email)
    return emailData
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
    if(emailData) throw { properties: { email: 'taken' } }
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
    if(!emailData) throw { properties: { email: 'notFound' } }
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
  async execute({ email, session }, { client, service }, emit) {
    const emailData = await Email.get(email)
    if(!emailData) throw { properties: { email: 'notFound' } }
    const { user } = emailData
    return service.trigger({
      type: 'signIn',
      user, session
    })
  }
})

module.exports = { Email }
