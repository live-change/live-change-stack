const autoValidation = require('@live-change/framework/lib/processors/autoValidation')
const nodemailer = require('nodemailer')
const app = require("@live-change/framework").app()

const definition = app.createServiceDefinition({
  name: "passwordAuthentication"
})
const config = definition.config

const secretProperties = {
  passwordHash: {
    type: String,
    secret: true,
    preFilter: config.passwordHash ||
      (password => password && crypto.createHash('sha256').update(password).digest('hex')),
    validation: config.passwordValidation || ['password']
  },
}

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
