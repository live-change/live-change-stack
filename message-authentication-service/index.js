const autoValidation = require('@live-change/framework/lib/processors/autoValidation')
const nodemailer = require('nodemailer')
const app = require("@live-change/framework").app()

const definition = app.createServiceDefinition({
  name: "messageAuthentication"
})
const config = definition.config

const contactProperties = {
  contactType: {
    type: String,
    validation: ['nonEmpty']
  },
  contact: {
    type: String,
    validation: ['nonEmpty']
  }
}

const targetProperties = {
  action: {
    type: String,
    validation: ['nonEmpty'],
  },
  actionProperties: {
    type: Object
  },
  targetPage: {
    type: Object,
    validation: ['nonEmpty'],
    properties: {
      name: {
        type: String,
        validation: ['nonEmpty']
      },
      params: {
        type: Object
      }
    }
  }
}

const Authentication = definition.model({
  name: 'Authentication',
  properties: {
    ...contactProperties,
    ...targetProperties,
    state: {
      type: "String",
      validation: ['nonEmpty'],
      options: ['created', 'used']
    }
  }
})

definition.view({
  name: "authentication",
  properties: {
    authentication: {
      type: Authentication
    }
  },
  daoPath({ authentication }, { client, context }) {
    return Authentication.path(authentication)
  }
})


definition.event({
  name: 'authenticationCreated',
  execute({ authentication, contactType, contact, action, actionProperties, targetPage }) {
    return Authentication.create({
      id: authentication,
      contactType, contact,
      action, actionProperties, targetPage,
      state: 'created'
     })
  }
})

definition.event({
  name: 'authenticationUsed',
  execute({ authentication }) {
    return Authentication.update(authentication, { state: 'used' })
  }
})

definition.trigger({
  name: 'authenticateWithMessage',
  waitForEvents: true,
  properties: {
    ...contactProperties,
    ...targetProperties
  },
  async execute({ contactType, contact, action, actionProperties, targetPage }, { client, service }, emit) {
    const authentication = app.generateUid()
    const secrets = await service.trigger({
      type: 'authenticationSecret',
      authentication
    })
    if(secrets.length == 0) throw new Error('no secrets generated!')
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    await service.trigger({
      type: 'send' + contactTypeUpperCase + 'Message',
      render: {
        action,
        contactType,
        contact,
        secrets
      }
    })
    emit({
      type: "authenticationCreated",
      authentication,
      contactType,
      contact,
      action,
      actionProperties,
      targetPage
    })
    return {
      authentication,
      secrets: secrets.map(({ secret, ...notSecret }) => notSecret)
    }
  }
})

definition.action({
  name: 'finishMessageAuthentication',
  waitForEvents: true,
  properties: {
    secretType: {
      type: String,
      validation: ['nonEmpty']
    },
    secret: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ secretType, secret }, { client, service }, emit) {
    const secretTypeUpperCase = secretType[0].toUpperCase() + secretType.slice(1)
    const checkResults = await service.trigger({
      type: 'check' + secretTypeUpperCase + 'Secret',
      secret
    })
    const authentication = checkResults[0]
    const authenticationData = await Authentication.get(authentication)
    if(authenticationData.state == 'used') throw 'authenticationUsed'
    const actionName = authenticationData.action
    const actionResults = await service.trigger({
      type: actionName+'Authenticated',
      ...authenticationData.actionProperties,
      contactType: authenticationData.contactType,
      contact: authenticationData.contact,
      session: client.session
    })
    emit({
      type: 'authenticationUsed',
      authentication
    })
    return actionResults[0]
  }
})

definition.action({
  name: 'resendMessageAuthentication',
  waitForEvents: true,
  properties: {
    authentication: {
      type: Authentication,
      validation: ['nonEmpty']
    }
  },
  async execute({ authentication }, { client, service }, emit) {
    const authenticationData = await Authentication.get(authentication)
    if(!authenticationData) throw 'notFound'
    const { contactType, contact, action } = authenticationData
    const secrets = await service.trigger({
      type: 'refreshAuthenticationSecret',
      authentication
    })
    if(secrets.length == 0) throw new Error('no secrets generated!')
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    await service.trigger({
      type: 'send' + contactTypeUpperCase + 'Message',
      render: {
        action,
        contactType,
        contact,
        secrets
      }
    })
    return {
      authentication,
      secrets: secrets.map(({ secret, ...notSecret }) => notSecret)
    }
  }
})

definition.trigger({
  name: 'signUpWithMessageAuthenticated',
  waitForEvents: true,
  properties: {
    ...contactProperties
  },
  async execute({ contactType, contact, session }, { service }, emit) {
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    const user = app.generateUid()
    await service.trigger({
      type: 'connect' + contactTypeUpperCase,
      [contactType]: contact,
      user
    })
    await service.trigger({
      type: 'signUpAndSignIn',
      user, session
    })
    return user
  }
})

definition.trigger({
  name: 'signInWithMessageAuthenticated',
  waitForEvents: true,
  properties: {
    ...contactProperties
  },
  async execute({ contactType, contact }, { client, service }, emit) {
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    const user = await service.trigger({
      type: 'signIn' + contactTypeUpperCase,
      [contactType]: contact,
    })
    return user
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

  if(contactConfig.signUp || config.signUp || contactConfig.signIn || config.signIn) {
    definition.action({
      name: 'signIn' + contactTypeUpperCaseName,
      waitForEvents: true,
      properties: {
        ...contactTypeProperties
      },
      async execute({ [contactTypeName]: contact }, { client, service }, emit) {

      }
    })
  }

  if(contactConfig.connect || config.connect ) {
    definition.action({
      name: 'connect',
      properties: {
        ...contactTypeProperties
      },
      async execute({ [contactTypeName]: contact }, { client, service }, emit) {

      }
    })
  }

  if(contactConfig.signUp || config.signUp) {
    definition.action({
      name: 'signUp' + contactTypeUpperCaseName,
      waitForEvents: true,
      properties: {
        ...contactTypeProperties
      },
      async execute({ [contactTypeName]: contact }, { client, service }, emit) {
        await service.trigger({
          type: 'checkNew' + contactTypeUName,
          [contactType]: contact,
        })
        return service.triggerService(definition.name, {
          type: 'authenticateWithMessage',
          contactType,
          contact,
          action: 'signUpWithMessage',
          targetPage: config.signUpTargetPage || { name: 'user:signUpFinished' }
        })
      }
    })
  }

  if(contactConfig.signUp || config.signUp) {
    definition.action({
      name: 'signInOrSignUp' + contactTypeUpperCaseName,
      waitForEvents: true,
      properties: {
        ...contactTypeProperties
      },
      async execute({ [contactType]: contact }, { client, service }, emit) {

      }
    })
  }

}

module.exports = definition
