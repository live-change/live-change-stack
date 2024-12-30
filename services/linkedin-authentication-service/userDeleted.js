import definition from './definition.js'
import { Account, User } from './account.js'
import { OfflineAccess } from './offlineAccessjs'

definition.event({
  name: "userDeleted",
  properties: {
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user }) {
    const accounts = await Account.indexRangeGet('byUser', user)
    const offlineAccesses = await OfflineAccess.indexRangeGet('byUser', user)
    await Promise.all([
      Promise.all(accounts.map(account => Account.delete(account.to ?? account.id))),
      Promise.all(offlineAccesses.map(offlineAccess => OfflineAccess.delete(offlineAccess.to ?? offlineAccess.id)))
    ])
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
