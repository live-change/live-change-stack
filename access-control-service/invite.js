const app = require("@live-change/framework").app()
const definition = require('./definition.js')
const config = definition.config

const { Invite, invitationProperties } = require('./model.js')
const access = require('./access.js')(definition)

definition.event({
  name: 'userInvited',
  async execute({ user, objectType, object, roles, message }) {
    await AccessInvitation.create({
      id: App.encodeIdentifier(['user_User', user, objectType, object]),
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
      id: App.encodeIdentifier([contactType, contact, objectType, object]),
      contactOrUserType: contactType, contactOrUser: contact,
      objectType, object,
      roles, message
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
        /// TODO: Send message to contact
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