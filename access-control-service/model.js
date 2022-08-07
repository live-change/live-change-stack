const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')
const config = definition.config
const access = require('./access.js')(definition)

const rolesArrayType = {
  type: Array,
  of: {
    type: String,
    validation: ['nonEmpty']
  },
  validation: ['elementsNonEmpty']
}

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
    roles: rolesArrayType,
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
    writeAccess: async (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params)
  },
  properties: {
    userRoles: rolesArrayType,
    sessionRoles: rolesArrayType,
    availableRoles: rolesArrayType,
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
    roles: rolesArrayType,
    message: {
      type: String,
      validation: []
    },
    lastUpdate: {
      type: Date
    }
  },
  indexes: {
  }
})

const invitationProperties = {
  roles: rolesArrayType,
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
    ...invitationProperties,
    lastUpdate: {
      type: Date
    }
  },
  indexes: {

  }
})

module.exports = { Access, PublicAccess, AccessRequest, AccessInvitation, invitationProperties, rolesArrayType }
