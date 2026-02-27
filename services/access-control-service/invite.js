import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config
import pluralize from 'pluralize'

const inviteMessageActionByObjectType = config.inviteMessageActionByObjectType ?? {}

import { AccessInvitation, invitationProperties, Access } from './model.js'
import accessModule from './access.js'
const access = accessModule(definition)

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

const Session = definition.foreignModel('session', 'Session')

definition.event({
  name: 'userInvited',
  async execute(params) {
    const { user, objectType, object, fromType, from } = params
    const contactOrUserType = 'user_User'
    const contactOrUser = user
    const data = {
      id: App.encodeIdentifier([ contactOrUserType, contactOrUser, objectType, object ]),
      contactOrUserType, contactOrUser,
      objectType, object, fromType, from
    }
    for(const propertyName in invitationProperties) data[propertyName] = params[propertyName]
    await AccessInvitation.create(data)
  }
})

definition.event({
  name: 'contactInvited',
  async execute(params) {
    const { contactType, contact, objectType, object, fromType, from } = params
    const contactOrUserType = contactType
    const contactOrUser = contact
    const data = {
      id: App.encodeIdentifier([ contactOrUserType, contactOrUser, objectType, object ]),
      contactOrUserType, contactOrUser,
      objectType, object, fromType, from
    }
    for(const propertyName in invitationProperties) data[propertyName] = params[propertyName]
    await AccessInvitation.create(data)
  }
})

definition.event({
  name: 'userInvitationAccepted',
  async execute({ user, objectType, object, roles }) {
    await AccessInvitation.delete(
        App.encodeIdentifier([ 'user_User', user, objectType, object ])
    )
    await Access.create({
      id: App.encodeIdentifier([ 'user_User', user, objectType, object ]),
      sessionOrUserType: 'user_User',
      sessionOrUser: user,
      objectType,
      object,
      roles
    })
  }
})

definition.trigger({
  name: 'AccessInvitationMoved',
  properties: {
    ...contactProperties,
    from: {
      contactOrUserType: {
        type: String
      },
      contactOrUser: {
        type: String
      }
    },
    to: {
      contactOrUserType: {
        type: String
      },
      contactOrUser: {
        type: String
      }
    },
    objectType: {
      type: String
    },
    object: {
      type: String
    }
  },
  async execute({ from, to, objectType, object }, { service }, emit) {
    const invitation = App.encodeIdentifier([from.contactOrUserType, from.contactOrUser, objectType, object])
    const invitationData = await AccessInvitation.get(invitation)
    console.error("MOVED!!!", {
      ...invitationData,
      type: 'notify',
      sessionOrUserType: 'user_User',
      sessionOrUser: to.contactOrUser,
      notificationType: 'accessControl_Invitation',
      id: undefined
    })
    if(to.contactOrUserType === 'user_User') {
      await service.trigger({ type: 'notify', }, {
        ...invitationData,
        sessionOrUserType: 'user_User',
        sessionOrUser: to.contactOrUser,
        notificationType: 'accessControl_Invitation',
        id: undefined
      })
    }
  }
})

definition.trigger({
  name: 'inviteWithMessageAuthenticated',
  waitForEvents: true,
  properties: {
    ...contactProperties,
    session: {
      type: Session,
      validation: ['nonEmpty']
    },
    actionProperties: {
      type: Object
    }
  },
  async execute({ contactType, contact, session, objectType, object }, { service }, emit) {
    console.error("INVITE WITH MESSAGE AUTHENTICATED", { contactType, contact, session, objectType, object })
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    /// Load invitation
    const invitation = App.encodeIdentifier([
      contactType + '_' + contactTypeUpperCase, contact, objectType, object
    ])
    console.log("INVITATION", invitation)
    const invitationData = await AccessInvitation.get(invitation)
    if(!invitationData) throw app.logicError("not_found")
    const { roles } = invitationData
    /// Create account and sign-in:
    const user = app.generateUid()
    await service.trigger({ type: 'connect' + contactTypeUpperCase }, {
      [contactType]: contact,
      user
    })
    await service.trigger({ type: 'signUpAndSignIn'  }, {
      user, session
    })
    emit({
      type: 'userInvitationAccepted',
      user, objectType, object, roles
    })
    return user
  }
})

definition.action({
  name: 'acceptInvitation',
  waitForEvents: true,
  properties: {
    objectType: {
      type: String,
      validation: ['nonEmpty']
    },
    object: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ objectType, object }, {client, service}, emit) {
    if(!client.user) throw app.logicError("not_authorized")
    const user = client.user
    const invitation = App.encodeIdentifier(['user_User', user, objectType, object])
    const invitationData = await AccessInvitation.get(invitation)
    console.log("INVITATION", invitation, invitationData)
    if(!invitationData) throw app.logicError("not_found")
    const { roles } = invitationData
    emit({
      type: 'userInvitationAccepted',
      user, objectType, object, roles
    })
  }
})

import task from '@live-change/task-service/task.js' // need to import taks.js to avoid circular dependency

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

  async function doInvite(contact, objectType, object, invitationData, emit, trigger = app.trigger) {
    const contactData = await app.viewGet('get' + contactTypeUName, { [contactType]: contact })
    if(contactData?.user) { // user exists
      const { user } = contactData
      await trigger({ type: 'notify' }, {
        sessionOrUserType: 'user_User',
        sessionOrUser: user,
        notificationType: 'accessControl_Invitation',
        objectType,
        object,
        ...invitationData, id: undefined
      })
      emit({
        type: 'userInvited',
        user,
        objectType, object,
        ...invitationData, id: undefined
      })
      return 'userInvited'
    } else {
      // Authenticate with message because we will create account later
      const messageData = {
        objectType, object,
        ...invitationData, id: undefined,
        action: inviteMessageActionByObjectType[objectType] ?? 'inviteWithMessage'
      }
      await trigger({ type: 'authenticateWithMessage' }, {
        contactType,
        contact,
        messageData,
        action: 'inviteWithMessage',
        actionProperties: { objectType, object },
        targetPage: { name: 'accessControl:invitationAccepted', params: { objectType, object } },
        fallbackPage: { name: 'accessControl:invitationFallback', params: { objectType, object } }
      })
      emit({
        type: 'contactInvited',
        contactType: contactTypeName + '_' + contactTypeUName,
        contact,
        objectType, object,
        ...invitationData, id: undefined
      })
      return 'contactInvited'
    }
  }

  definition.action({
    name: 'invite' + contactTypeUpperCaseName,
    waitForEvents: true,
    properties: {
      objectType: {
        type: String,
        validation: ['nonEmpty']
      },
      object: {
        type: String,
        validation: ['nonEmpty']
      },
      ...contactTypeProperties,
      ...invitationProperties
    },
    access: (params, { client, context, visibilityTest}) =>
        visibilityTest || access.clientCanInvite(client, params),
    async execute(params, { client, service, trigger }, emit) {
      const { [contactTypeName]: contact } = params
      const { objectType, object } = params
      const { roles } = params

      const myRoles = await access.getClientObjectRoles(client, { objectType, object }, true)
      if(!myRoles.includes('admin')) {
        for(const requestedRole of roles) {
          if(!myRoles.includes(requestedRole)) throw app.logicError("notAuthorized")
        }
      }

      const [ fromType, from ] = client.user ? ['user_User', client.user] : ['session_Session', client.session]
      const invitationData = { fromType, from, roles }
      for(const propertyName in invitationProperties) invitationData[propertyName] = params[propertyName]
      await doInvite(contact, objectType, object, invitationData, emit, trigger)
    }
  })

  const inviteOneTask = task({
    name: "invite" + contactTypeUpperCaseName,
    properties: {
      objectType: {
        type: String,
        validation: ['nonEmpty']
      },
      object: {
        type: String,
        validation: ['nonEmpty']
      },
      fromType: {
        type: String,
        validation: ['nonEmpty']
      },
      from: {
        type: String,
        validation: ['nonEmpty']
      },
      ...contactTypeProperties,
      ...invitationProperties
    },
    maxRetries: 1,
    async execute(params, { service, task, trigger }, emit) {
      const { [contactTypeName]: contact } = params
      const { objectType, object } = params
      const { roles } = params
      const { fromType, from } = params
      const invitationData = { fromType, from, roles }
      for(const propertyName in invitationProperties) invitationData[propertyName] = params[propertyName]
      return await doInvite(contact, objectType, object, invitationData, emit, trigger)
    }
  }, definition)

  const inviteManyTask = task({
    name: "inviteMany" + contactTypeUpperCaseName,
    properties: {
      objectType: {
        type: String,
        validation: ['nonEmpty']
      },
      object: {
        type: String,
        validation: ['nonEmpty']
      },
      fromType: {
        type: String,
        validation: ['nonEmpty']
      },
      from: {
        type: String,
        validation: ['nonEmpty']
      },
      ...invitationProperties,
      contacts: {
        type: Array,
        of: {
          type: Object,
          properties: contactTypeProperties
        }
      }
    },
    async execute(params, { service, task, trigger }, emit) {
      const contactsCount = params.contacts.length
      for(let i = 0; i < contactsCount; i++) {
        task.progress(i, contactsCount, 'inviting')
        const contact = params.contacts[i]
        try {
          task.run(inviteOneTask, {
            ...params,
            ...contact
          })
        } catch(e) {
          // ignore errors
        }
      }
      task.progress(contactsCount, contactsCount, 'done')
    }
  }, definition)

  definition.action({
    name: 'inviteMany' + pluralize(contactTypeUpperCaseName),
    waitForEvents: true,
    properties: {
      objectType: {
        type: String,
        validation: ['nonEmpty']
      },
      object: {
        type: String,
        validation: ['nonEmpty']
      },
      ...invitationProperties,
      contacts: {
        validation: ['nonEmpty'],
        type: Array,
        of: {
          type: Object,
          properties: contactTypeProperties
        }
      }
    },
    access: (params, { client, context, visibilityTest}) =>
      visibilityTest || access.clientCanInvite(client, params),
    async execute(params, { client, service, trigger, command  }, emit) {
      const { objectType, object } = params

      const myRoles = await access.getClientObjectRoles(client, { objectType, object }, true)
      if(!myRoles.includes('admin')) {
        for(const requestedRole of roles) {
          if(!myRoles.includes(requestedRole)) throw app.logicError("notAuthorized")
        }
      }

      const [ fromType, from ] = client.user ? ['user_User', client.user] : ['session_Session', client.session]

      return await inviteManyTask.start({
        ...params,
        fromType, from,
        ownerType: objectType,
        owner: object,
      }, 'action', command.id )
    }
  })

  definition.action({
    name: 'inviteMany' + pluralize(contactTypeUpperCaseName) + 'FromText',
    waitForEvents: true,
    properties: {
      objectType: {
        type: String,
        validation: ['nonEmpty']
      },
      object: {
        type: String,
        validation: ['nonEmpty']
      },
      ...invitationProperties,
      [pluralize(contactTypeName) + 'Text']: {
        type: String,
        validation: ['nonEmpty']
      }
    },
    access: (params, { client, context, visibilityTest}) =>
      visibilityTest || access.clientCanInvite(client, params),
    async execute(params, { client, service, trigger, command  }, emit) {
      const fieldName = pluralize(contactTypeName) + 'Text'
      const contacts = params[fieldName].split(/[,;\n]/).map(line => {
        const parts = line.split('\t')
        return parts[0].trim()
      }).filter(x => !!x).map(contact => ({ [contactTypeName]: contact }))

      if(contacts.length === 0) throw {
        properties: { [fieldName]: 'empty' }
      }
      for(const contact of contacts) {
        console.log("C", contact)
        const error = service.definition.validators[contactTypeName]()(contact[contactTypeName], {
          source: { properties: { [fieldName]: contact[contactTypeName] } }
        })
        if(error) throw {
          properties: { [fieldName]: error }
        }
      }

      const { objectType, object } = params

      const myRoles = await access.getClientObjectRoles(
        client, { objectType, object }, true
      )
      if(!myRoles.includes('admin')) {
        for(const requestedRole of roles) {
          if(!myRoles.includes(requestedRole)) throw app.logicError("notAuthorized")
        }
      }

      const [ fromType, from ] = client.user ? ['user_User', client.user] : ['session_Session', client.session]

      return await inviteManyTask.start({
        ...params,
        fromType, from,
        ownerType: objectType,
        owner: object,
        contacts
      }, 'action', command.id )
    }
  })

}
