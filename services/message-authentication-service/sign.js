import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
import config from "./config.js"

import { contactProperties } from './authentication.js'

definition.trigger({
  name: 'signUpWithMessageAuthenticated',
  waitForEvents: true,
  properties: {
    ...contactProperties
  },
  async execute({ contactType, contact, session }, { service }, _emit) {
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    const user = app.generateUid()
    await service.trigger({ type: 'connect' + contactTypeUpperCase }, {
      [contactType]: contact,
      user
    })
    await service.trigger({ type: 'signUpAndSignIn' }, {
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
  async execute({ contactType, contact, session }, { service }, _emit) {
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    const user = await service.trigger({ type: 'signIn' + contactTypeUpperCase }, {
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
  async execute({ contactType, contact, user }, { client, service }, _emit) {
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    await service.trigger({ type: 'connect' + contactTypeUpperCase }, {
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
      async execute({ [contactTypeName]: contact }, { service }, _emit) {
        await service.trigger({ type: 'checkNew' + contactTypeUName }, {
          [contactTypeName]: contact,
        })
        return service.triggerService({ service: definition.name, type: 'authenticateWithMessage' }, {
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
      async execute({ [contactTypeName]: contact }, { _client, service }, _emit) {
        const contactData = await app.viewGet('get'+contactTypeUName, { [contactType]: contact })
        if(!contactData) throw { properties: { email: 'notFound' } }
        const messageData = {
          user: contactData.user
        }
        return service.triggerService({ service: definition.name, type: 'authenticateWithMessage' }, {
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
      async execute({ [contactTypeName]: contact }, { client, service }, _emit) {
        await service.trigger({ type: 'checkNew' + contactTypeUName }, {
          [contactTypeName]: contact,
        })
        return service.triggerService({ service: definition.name, type: 'authenticateWithMessage' }, {
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
      async execute({ [contactTypeName]: contact }, { client, service }, _emit) {
        const contacts = (await service.trigger({ type: 'getConnectedContacts' }, {
          user: client.user
        })).flat()
        console.log("CONTACTS", contacts, contactTypeName, contact)
        const contactData = contacts.find(c =>
          c.type === contactTypeName && c.contact === contact
        )
        if(!contactData) throw 'notFound'
        if(contacts.length === 1) throw 'lastOne'
        console.log("DISCONNECT", contact)
        return await service.trigger({ type: 'disconnect' + contactTypeUName }, {
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
      async execute({ [contactTypeName]: contact }, { client, service }, _emit) {
        const contactData = await app.viewGet('get'+contactTypeUName, { [contactType]: contact })
        if(contactData) {
          const messageData = {
            user: contactData.user
          }
          return service.triggerService({ service: definition.name, type: 'authenticateWithMessage' }, {
            contactType,
            contact,
            messageData,
            action: 'signInWithMessage',
            targetPage: config.signInTargetPage || { name: 'user:signInFinished' }
          })
        } else {
          return service.triggerService({ service: definition.name, type: 'authenticateWithMessage' }, {
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
