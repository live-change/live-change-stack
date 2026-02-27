import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
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
  },
  fallbackPage: {
    type: Object,
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
  },
  indexes: {
    byContact: {
      property: ['contactType', 'contact']
    }
  }
})

definition.event({
  name: 'authenticationCreated',
  execute({ authentication, contactType, contact, action, actionProperties,
            targetPage, fallbackPage, messageData }) {
    return Authentication.create({
      id: authentication,
      contactType, contact,
      action, actionProperties, targetPage, fallbackPage,
      messageData,
      state: 'created'
     })
  }
})

definition.event({
  name: 'authenticationUsed',
  execute({ authentication, targetPage }) {
    return Authentication.update(authentication, { state: 'used', targetPage })
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

definition.trigger({
  name: 'authenticateWithMessage',
  waitForEvents: true,
  properties: {
    ...contactProperties,
    ...targetProperties,
    ...messageProperties
  },
  async execute({ contactType, contact, action, actionProperties, targetPage, fallbackPage, messageData },
      { trigger }, emit) {
    const authentication = app.generateUid()
    const secrets = await trigger({ type: 'authenticationSecret' }, {
      authentication
    })
    if(secrets.length === 0) throw new Error('no secrets generated!')
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    await trigger({ type: 'send' + contactTypeUpperCase + 'Message' }, {
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
      fallbackPage,      
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
    const checkResults = await service.trigger({ type: 'check' + secretTypeUpperCase + 'Secret' }, {
      secret,
      authentication,
      client
    })
    authentication = checkResults[0]
    const authenticationData = await Authentication.get(authentication)
    if(authenticationData.state === 'used') throw app.logicError("authenticationUsed")
    const actionName = authenticationData.action
    const actionResults = await service.trigger({ type: actionName+'Authenticated' }, {
      ...authenticationData.actionProperties,
      contactType: authenticationData.contactType,
      contact: authenticationData.contact,
      session: client.session
    })
    const result = actionResults[0]
    const targetPage = (typeof result == 'object')
      ? { ...authenticationData.targetPage, params: { ...authenticationData.targetPage.params, ...result } }
      : authenticationData.targetPage
    emit({
      type: 'authenticationUsed',
      authentication,
      targetPage
    })
    return { result, targetPage }
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
    if(!authenticationData) throw app.logicError("notFound")
    const { contactType, contact, action } = authenticationData
    const secrets = await service.trigger({ type: 'refreshAuthenticationSecret' }, {
      authentication
    })
    if(secrets.length === 0) throw new Error('no secrets generated!')
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    await service.trigger({ type: 'send' + contactTypeUpperCase + 'Message' }, {
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

export { Authentication, contactProperties, targetProperties, messageProperties }
