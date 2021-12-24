const crypto = require('crypto')
const app = require("@live-change/framework").app()
const user = require('@live-change/user-service')
const { AuthenticatedUser } = require("../user-service/model.js")

const definition = app.createServiceDefinition({
  name: "passwordAuthentication",
  use: [ user ]
})
const config = definition.config

const User = definition.foreignModel('user', 'User')

const secretProperties = {
  passwordHash: {
    type: String,
    secret: true,
    preFilter: config.passwordHash ||
      (password => password && crypto.createHash('sha256').update(password).digest('hex')),
    validation: config.passwordValidation || ['password']
  },
}

const PasswordAuthentication = definition.model({
  name: 'PasswordAuthentication',
  userProperty: {
    userViews: [
      { suffix: 'Exists', fields: ['user'] }
    ]
  },
  properties: {
    ...secretProperties,
  }
})

definition.event({
  name: 'passwordAuthenticationSet',
  async execute({ user, passwordHash }) {
    await PasswordAuthentication.create({ id: user, user, passwordHash })
  }
})

definition.action({
  name: 'setPassword',
  waitForEvents: true,
  properties: {
    ...secretProperties
  },
  access: (params, { client }) => {
    return !!client.user
  },
  async execute({ passwordHash }, { client, service }, emit) {
    const user = client.user
    const passwordAuthenticationData = await PasswordAuthentication.get(user)
    if(passwordAuthenticationData) throw 'exists'
    emit({
      type: 'passwordAuthenticationSet',
      user, passwordHash
    })
  }
})

definition.action({
  name: 'changePassword',
  waitForEvents: true,
  properties: {
    currentPasswordHash: secretProperties.passwordHash,
    ...secretProperties
  },
  access: (params, { client }) => {
    return !!client.user
  },
  async execute({ currentPasswordHash, passwordHash }, { client, service }, emit) {
    const user = client.user
    const passwordAuthenticationData = await PasswordAuthentication.get(user)
    if(!passwordAuthenticationData) throw 'notFound'
    if(currentPasswordHash != passwordAuthenticationData.passwordHash) throw { properties: {
      currentPasswordHash: 'wrongPassword'
    } }
    emit({
      type: 'passwordAuthenticationSet',
      user, passwordHash
    })
  }
})

for(const contactType of config.contactTypes) {
  const contactTypeUpperCaseName = contactType[0].toUpperCase() + contactType.slice(1)

  const contactConfig = (typeof contactType == "string") ? { name: contactType } : contactType

  const contactTypeName = contactConfig.name
  const contactTypeUName = contactTypeName[0].toUpperCase() + contactTypeName.slice(1)

  const contactTypeProperties = {
    [contactType]: {
      type: String,
      validation: ['nonEmpty', contactTypeName]
    }
  }

  definition.action({
    name: 'signIn' + contactTypeUpperCaseName,
    waitForEvents: true,
    properties: {
      ...contactTypeProperties,
      ...secretProperties
    },
    async execute({ [contactTypeName]: contact, passwordHash }, { client, service }, emit) {
      await service.trigger({
        type: 'checkExisting' + contactTypeUName,
        [contactType]: contact,
      })
      if(passwordHash) { // login with password
        throw Error('not implemented yet')
      } else { // login without password - with message
        if(!config.signInWithoutPassword) throw { properties: { passwordHash: 'empty' } }
        const contactData = (await service.trigger({
          type: 'get' + contactTypeUName,
          [contactType]: contact,
        }))[0]
        const messageData = {
          user: contactData.user
        }
        const results = await service.trigger({
          type: 'authenticateWithMessage',
          contactType,
          contact,
          messageData,
          action: 'signInWithMessage',
          targetPage: config.signInTargetPage || { name: 'user:signInFinished' }
        })
        return results[0]
      }
    }
  })

}

definition.processor(function(service, app) {
  service.validators.password = require('./passwordValidator.js')
})


module.exports = definition
