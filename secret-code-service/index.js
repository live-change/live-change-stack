const nodemailer = require('nodemailer')
const app = require("@live-change/framework").app()
const crypto = require('crypto')

const definition = app.createServiceDefinition({
  name: "secretCode"
})
const config = definition.config

const MessageAuthentication = definition.foreignModel('messageAuthentication', 'Authentication')

const targetProperties = {
  authentication: {
    type: MessageAuthentication,
    validation: ['nonEmpty']
  }
}

const secretProperties = {
  secretCode: {
    type: String,
    validation: ['nonEmpty']
  }
}

const Code = definition.model({
  name: "Code",
  properties: {
    ...targetProperties,
    ...secretProperties,
    expire: {
      type: Date,
      validation: ['nonEmpty']
    }
  },
  indexes: {
    byAuthenticationAndSecretCode: {
      property: ['authentication', 'secretCode']
    },
    byAuthentication: {
      property: 'authentication'
    }
  }
})

definition.event({
  name: 'codeCreated',
  execute({ code, authentication, secretCode, expire }) {
    return Code.create({ id: code, authentication, secretCode, expire })
  }
})

definition.event({
  name: 'codeExpired',
  execute({ code }) {
    return Code.update(code, { date: new Date(Date.now() - 1000) })
  }
})

definition.trigger({
  name: "authenticationSecret",
  properties: {
    ...targetProperties
  },
  waitForEvents: true,
  async execute({ authentication }, context, emit) {
    const code = app.generateUid()
    const digits = config.digits || 6
    const secretCode = crypto.randomInt(0, Math.pow(10, digits)).toFixed().padStart(digits, '0')
    const expire = new Date()
    expire.setTime(Date.now() + (config.expireTime || 10*60*1000))
    emit({
      type: 'codeCreated',
      code,
      authentication,
      secretCode, expire
    })
    return {
      type: 'code',
      code,
      expire,
      secret: {
        secretCode
      }
    }
  }
})

definition.trigger({
  name: "refreshAuthenticationSecret",
  properties: {
    ...targetProperties
  },
  waitForEvents: true,
  async execute({ authentication }, context, emit) {
    const currentCode = await Code.indexObjectGet('byAuthentication', authentication)
    if(currentCode) {
      emit({ type: 'codeExpired', code: currentCode.id })
    }
    const code = app.generateUid()
    const digits = config.digits || 6
    const secretCode = crypto.randomInt(0, Math.pow(10, digits)).toFixed().padStart(digits, '0')
    const expire = new Date()
    expire.setTime(Date.now() + (config.expireTime || 24*60*60*1000))
    emit({
      type: 'codeCreated',
      code,
      authentication,
      secretCode, expire
    })
    return {
      type: 'code',
      code,
      expire,
      secret: {
        secretCode
      }
    }
  }
})

definition.trigger({
  name: "checkCodeSecret",
  properties: {
    secret: {
      type: String,
      validation: ['nonEmpty']
    },
    authentication: {
      type: String,
      validation: ['nonEmpty']
    },
    client: {
      type: Object,
      validation: ['nonEmpty']
    }
  },
  secured: {},
  async execute({ secret, authentication, client }, context, emit) {
    const codeData = await Code.indexObjectGet('byAuthenticationAndSecretCode', [authentication, secret])
    if(!codeData) {
      if(client) {
        await context.trigger({
          type: 'securityEvent',
          event: {
            type: 'wrong-secret-code',
            properties: {
              authentication
            }
          },
          client
        })
      }
      throw { properties: { secret: 'codeNotFound' } }
    }
    if(new Date().toISOString() > codeData.expire) {
      throw { properties: { secret: "codeExpired" } }
    }
    return codeData.authentication
  }
})

module.exports = definition
