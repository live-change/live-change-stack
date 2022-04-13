const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')
const config = definition.config
const access = require('./access.js')(definition)

const Access = definition.model({
  name: 'Access',
  sessionOrUserProperty: {
    extendedWith: ['object'],
    ownerReadAccess: () => true,
    readAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAnyAccess(client, params),
    updateAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params),
    resetAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params)
  },
  properties: {
    roles: {
      type: Array,
      of: {
        type: String,
        validation: ['nonEmpty']
      },
      validation: ['elementsNonEmpty']
    },
    lastUpdate: {
      type: Date
    }
  }
})

const PublicAccess = definition.model({
  name: "PublicAccess",
  propertyOfAny: {
    to: 'object',
    readAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAnyAccess(client, params),
    writeAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params)
  },
  properties: {
    userRoles: {
      type: Array,
      of: {
        type: String,
        validation: ['nonEmpty']
      },
      validation: ['elementsNonEmpty']
    },
    sessionRoles: {
      type: Array,
      of: {
        type: String,
        validation: ['nonEmpty']
      },
      validation: ['elementsNonEmpty']
    },
    availableRoles: {
      type: Array,
      of: {
        type: String,
        validation: ['nonEmpty']
      },
      validation: ['elementsNonEmpty']
    },
    lastUpdate: {
      type: Date
    }
  },
  indexes: {
  }
})

const AccessRequest = definition.model({
  name: 'AccessRequest',
  sessionOrUserProperty: {
    extendedWith: ['object'],
    ownerReadAccess: () => true,
    ownerResetAccess: () => true,
    readAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAnyAccess(client, params),
    updateAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params),
    resetAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params)
  },
  properties: {
    roles: {
      type: Array,
      of: {
        type: String,
        validation: ['nonEmpty']
      },
      validation: ['elementsNonEmpty']
    },
    message: {
      type: String,
      validation: []
    }
  },
  indexes: {
  }
})

const invitationProperties = {
  roles: {
    type: Array,
    of: {
      type: String,
      validation: ['nonEmpty']
    },
    validation: ['elementsNonEmpty']
  },
  message: {
    type: String,
    validation: []
  }
}

const AccessInvitation = definition.model({
  name: 'AccessInvitation',
  contactOrUserProperty: {
    extendedWith: ['object'],
    ownerReadAccess: () => true,
    ownerResetAccess: () => true,
    readAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAnyAccess(client, params),
    updateAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params),
    resetAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params)
  },
  properties: {
    ...invitationProperties
  },
  indexes: {

  }
})

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

module.exports = { Access, PublicAccess, AccessRequest, AccessInvitation, invitationProperties }
