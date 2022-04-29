const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')
const config = definition.config

const { AccessInvitation, invitationProperties, Access } = require('./model.js')
const access = require('./access.js')(definition)

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
  async execute({ user, objectType, object, roles, message }) {
    await AccessInvitation.create({
      id: App.encodeIdentifier([ 'user_User', user, objectType, object ]),
      contactOrUserType: 'user_User', contactOrUser: user,
      objectType, object,
      roles, message
    })
  }
})

definition.event({
  name: 'contactInvited',
  async execute({ contactType, contact, objectType, object, roles, message }) {
    await AccessInvitation.create({
      id: App.encodeIdentifier([ contactType, contact, objectType, object ]),
      contactOrUserType: contactType, contactOrUser: contact,
      objectType, object,
      roles, message
    })
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
    const contactTypeUpperCase = contactType[0].toUpperCase() + contactType.slice(1)
    /// Load invitation
    const invitation = App.encodeIdentifier([ contactType + '_' + contactTypeUpperCase, contact, objectType, object ])
    console.log("INVITATION", invitation)
    const invitationData = await AccessInvitation.get(invitation)
    if(!invitationData) throw 'not_found'
    const { roles } = invitation
    /// Create account and sign-in:
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
    emit({
      type: 'userInvitationAccepted',
      user, objectType, object, roles
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
      const invitationData = { }
      for(const propertyName in invitationProperties) invitationData[propertyName] = params[propertyName]

      const contactData = (await service.trigger({
        type: 'get' + contactTypeUName + 'OrNull',
        [contactType]: contact,
      }))[0]
      if(contactData?.user) { // user exists
        /// TODO: Trigger notification
        emit({
          type: 'userInvited',
          user: contactData.user,
          objectType, object,
          ...invitationData
        })
      } else {
        // Authenticate with message because we will create account later
        const messageData = {
          fromType: client.user ? 'user_User' : 'session_Session',
          from: client.user ?? client.session,
          objectType, object,
          roles: params.roles,
          message: params.message
        }
        await service.trigger({
          type: 'authenticateWithMessage',
          contactType,
          contact,
          messageData,
          action: 'inviteWithMessage',
          actionProperties: { objectType, object },
          targetPage: { name: 'access:invitationAccepted', objectType, object }
        })
        emit({
          type: 'contactInvited',
          contactType: contactTypeName + '_' + contactTypeUName,
          contact,
          objectType, object,
          ...invitationData
        })
      }
    }
  })

}