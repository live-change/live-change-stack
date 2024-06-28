import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

export const User = definition.foreignModel("user", "User")

export const googleProperties = {
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

export const Account = definition.model({
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
