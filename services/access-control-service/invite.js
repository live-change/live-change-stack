import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config

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
  name: 'contactOrUserOwnedAccessInvitationMoved',
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
    if(!invitationData) throw 'not_found'
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
    if(!client.user) throw 'not_authorized'
    const user = client.user
    const invitation = App.encodeIdentifier(['user_User', user, objectType, object])
    const invitationData = await AccessInvitation.get(invitation)
    console.log("INVITATION", invitation, invitationData)
    if(!invitationData) throw 'not_found'
    const { roles } = invitationData
    emit({
      type: 'userInvitationAccepted',
      user, objectType, object, roles
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
    access: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientCanInvite(client, params),
    async execute(params, { client, service }, emit) {
      const { [contactTypeName]: contact } = params
      const { objectType, object } = params
      const { roles } = params

      const myRoles = await access.getClientObjectRoles(client, { objectType, object }, true)
      if(!myRoles.includes('admin')) {
        for(const requestedRole of roles) {
          if(!myRoles.includes(requestedRole)) throw 'notAuthorized'
        }
      }

      const [ fromType, from ] = client.user ? ['user_User', client.user] : ['session_Session', client.session]
      const invitationData = { fromType, from }
      for(const propertyName in invitationProperties) invitationData[propertyName] = params[propertyName]

      const contactData = (await service.trigger({ type: 'get' + contactTypeUName + 'OrNull'  }, {
        [contactType]: contact,
      }))[0]
      if(contactData?.user) { // user exists
        const { user } = contactData
        await service.trigger({ type: 'notify'  }, {
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
      } else {
        // Authenticate with message because we will create account later
        const messageData = {
          objectType, object,
          ...invitationData, id: undefined,
          action: inviteMessageActionByObjectType[objectType] ?? 'inviteWithMessage',
        }
        await service.trigger({ type: 'authenticateWithMessage'  }, {
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
      }
    }
  })

}
