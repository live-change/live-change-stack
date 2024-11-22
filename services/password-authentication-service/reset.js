import App from '@live-change/framework'
const app = App.app()
import { randomString } from '@live-change/uid'
import definition from './definition.js'
const config = definition.config
import { secretProperties } from './model.js'

const User = definition.foreignModel('user', 'User')

const ResetPasswordAuthentication = definition.model({
  name: 'ResetPasswordAuthentication',
  userProperty: {
    userReadAccess: () => true
  },
  properties: {
    expire: {
      type: Date,
      validation: ['nonEmpty']
    },
    key: {
      type: String,
      validation: ['nonEmpty']
    },
    state: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  indexes: {
    byKey: {
      property: 'key'
    }
  }
})

definition.event({
  name: 'resetPasswordAuthenticationCreated',
  async execute({ resetPasswordAuthentication, user, key, expire }) {
    await ResetPasswordAuthentication.create({ id: resetPasswordAuthentication, user, key, expire, state: 'created' })
  }
})

definition.event({
  name: 'resetPasswordAuthenticationUsed',
  async execute({ resetPasswordAuthentication }) {
    await ResetPasswordAuthentication.update(resetPasswordAuthentication, { state: 'used' })
  }
})

definition.view({
  name: "resetPasswordAuthentication",
  properties: {
    key: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  daoPath({ key }, { client, context }) {
    return ResetPasswordAuthentication.indexObjectPath('byKey', key)
  }
})

for(const contactType of config.contactTypes) {

  const contactConfig = (typeof contactType == "string") ? { name: contactType } : contactType
  const contactTypeName = contactConfig.name
  const contactTypeUName = contactTypeName[0].toUpperCase() + contactTypeName.slice(1)

  const contactTypeProperties = {
    [contactTypeName]: {
      type: String,
      validation: ['nonEmpty', contactTypeName]
    }
  }

  definition.action({
    name: 'resetPassword' + contactTypeUName,
    waitForEvents: true,
    properties: {
      ...contactTypeProperties
    },
    async execute({ [contactTypeName]: contact }, { client, service }, emit) {
      const contactData = await app.viewGet('get'+contactTypeUName, { [contactType]: contact })
      if(!contactData) throw { properties: { email: 'notFound' } }
      const { user } = contactData
      const messageData = { user }
      const actionProperties = { user }
      return (await service.trigger({ type: 'authenticateWithMessage' }, {
        contactType,
        contact,
        messageData,
        action: 'startResetPasswordWithMessage',
        actionProperties,
        targetPage: config.resetPasswordTargetPage || { name: 'user:resetPasswordForm' }
      }))[0]
    }
  })

}

definition.trigger({
  name: 'startResetPasswordWithMessageAuthenticated',
  waitForEvents: true,
  properties: {
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, session }, { client, service }, emit) {
    if(!user) throw new Error('user required')
    const resetPasswordAuthentication = app.generateUid()
    const key = randomString(config.resetKeyLength || 16)
    const expire = new Date()
    expire.setTime(Date.now() + (config.resetExpireTime || 1*60*60*1000))
    service.trigger({ type: 'signIn' }, {
      user, session
    })
    emit({
      type: 'resetPasswordAuthenticationCreated',
      resetPasswordAuthentication,
      user, key, expire
    })
    return {
      resetKey: key
    }
  }
})

definition.action({
  name: 'finishResetPassword',
  waitForEvents: true,
  properties: {
    key: {
      type: String,
      validation: ['nonEmpty']
    },
    ...secretProperties
  },
  async execute({ key, passwordHash }, { client, service }, emit) {
    const resetPasswordAuthenticationData = await ResetPasswordAuthentication.indexObjectGet('byKey', key)
    console.log("RESET AUTH", resetPasswordAuthenticationData)
    if(!resetPasswordAuthenticationData) throw 'authenticationNotFound'
    if(resetPasswordAuthenticationData.state === 'used') throw 'authenticationUsed'
    if(resetPasswordAuthenticationData.expire < (new Date().toISOString())) throw 'authenticationExpired'
    const { user } = resetPasswordAuthenticationData
    emit([{
      type: 'passwordAuthenticationSet',
      user, passwordHash
    }, {
      type: 'resetPasswordAuthenticationUsed',
      resetPasswordAuthentication: resetPasswordAuthenticationData.id
    }])
  }
})
