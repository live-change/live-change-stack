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

const messageProperties = {
  messageData: {
    type: Object
  }
}

const Authentication = definition.model({
  name: 'Authentication',
  properties: {
    ...contactProperties,
    ...targetProperties,
    ...messageProperties,
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
  execute({ authentication, contactType, contact, action, actionProperties, targetPage, messageData }) {
    return Authentication.create({
      id: authentication,
      contactType, contact,
      action, actionProperties, targetPage,
      messageData,
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
    ...targetProperties,
    ...messageProperties
  },
  async execute({ contactType, contact, action, actionProperties, targetPage, messageData },
      { client, service }, emit) {
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
        secrets,
        ...messageData
      }
    })
    emit({
      type: "authenticationCreated",
      authentication,
      contactType,
      contact,
      action,
      actionProperties,
      targetPage,
      messageData
    })
    return {
      type: 'sent',
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
    },
    authentication: {
      type: Authentication
    }
  },
  async execute({ secretType, secret, authentication = undefined }, { client, service }, emit) {
    const secretTypeUpperCase = secretType[0].toUpperCase() + secretType.slice(1)
    const checkResults = await service.trigger({
      type: 'check' + secretTypeUpperCase + 'Secret',
      secret,
      authentication
    })
    authentication = checkResults[0]
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
    return {
      result: actionResults[0],
      targetPage: authenticationData.targetPage
    }
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
        secrets,
        ...authentication.messageData
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
  async execute({ contactType, contact, session }, { client, service }, emit) {
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    const user = await service.trigger({
      type: 'signIn' + contactTypeUpperCase,
      [contactType]: contact,
      session
    })
    return user
  }
})

definition.trigger({
  name: 'connectWithMessageAuthenticated',
  waitForEvents: true,
  properties: {
    ...contactProperties
  },
  async execute({ contactType, contact, user }, { client, service }, emit) {
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    await service.trigger({
      type: 'connect' + contactTypeUpperCase,
      [contactType]: contact,
      user
    })
    return user
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

  if(contactConfig.signUp || config.signUp) {
    definition.action({
      name: 'signUp' + contactTypeUName,
      waitForEvents: true,
      properties: {
        ...contactTypeProperties
      },
      async execute({ [contactTypeName]: contact }, { client, service }, emit) {
        await service.trigger({
          type: 'checkNew' + contactTypeUName,
          [contactTypeName]: contact,
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

  if(contactConfig.signUp || config.signUp || contactConfig.signIn || config.signIn) {
    definition.action({
      name: 'signIn' + contactTypeUName,
      waitForEvents: true,
      properties: {
        ...contactTypeProperties
      },
      async execute({ [contactTypeName]: contact }, { client, service }, emit) {
        const contactData = await service.trigger({
          type: 'get' + contactTypeUName,
          [contactTypeName]: contact,
        })
        const messageData = {
          user: contactData.user
        }
        return service.triggerService(definition.name, {
          type: 'authenticateWithMessage',
          contactType,
          contact,
          messageData,
          action: 'signInWithMessage',
          targetPage: config.signInTargetPage || { name: 'user:signInFinished' }
        })
      }
    })
  }

  if(contactConfig.connect || config.connect ) {
    definition.action({
      name: 'connect' + contactTypeUName,
      properties: {
        ...contactTypeProperties
      },
      access: (params, { client }) => {
        return !!client.user
      },
      async execute({ [contactTypeName]: contact }, { client, service }, emit) {
        await service.trigger({
          type: 'checkNew' + contactTypeUName,
          [contactTypeName]: contact,
        })
        return service.triggerService(definition.name, {
          type: 'authenticateWithMessage',
          contactType,
          contact,
          action: 'connectWithMessage',
          actionProperties: {
            user: client.user
          },
          messageData: {
            user: client.user
          },
          targetPage: config.signUpTargetPage || { name: 'user:connectFinished' }
        })
      }
    })

    definition.action({
      name: 'disconnect' + contactTypeUName,
      properties: {
        ...contactTypeProperties
      },
      access: (params, { client }) => {
        return !!client.user
      },
      async execute({ [contactTypeName]: contact }, { client, service }, emit) {
        const contacts = (await service.trigger({
          type: 'getConnectedContacts',
          user: client.user
        })).flat()
        console.log("CONTACTS", contacts, contactTypeName, contact)
        const contactData = contacts.find(c => c.type == contactTypeName && c.contact == contact)
        if(!contactData) throw 'notFound'
        if(contacts.length == 1) throw 'lastOne'
        console.log("DISCONNECT", contact)
        return await service.trigger({
          type: 'disconnect' + contactTypeUName,
          [contactTypeName]: contact,
          user: client.user
        })
      }
    })
  }

  if(contactConfig.signUp || config.signUp) {
    definition.action({
      name: 'signInOrSignUp' + contactTypeUName,
      waitForEvents: true,
      properties: {
        ...contactTypeProperties
      },
      async execute({ [contactTypeName]: contact }, { client, service }, emit) {
        const contactData = await service.trigger({
          type: 'get' + contactTypeUName + 'OrNull',
          [contactTypeName]: contact,
        })
        if(contactData) {
          const messageData = {
            user: contactData.user
          }
          return service.triggerService(definition.name, {
            type: 'authenticateWithMessage',
            contactType,
            contact,
            messageData,
            action: 'signInWithMessage',
            targetPage: config.signInTargetPage || { name: 'user:signInFinished' }
          })
        } else {
          return service.triggerService(definition.name, {
            type: 'authenticateWithMessage',
            contactType,
            contact,
            action: 'signUpWithMessage',
            targetPage: config.signUpTargetPage || { name: 'user:signUpFinished' }
          })
        }
      }
    })
  }

}

module.exports = definition
