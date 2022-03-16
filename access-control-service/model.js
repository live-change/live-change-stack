const definition = require('./definition.js')
const config = definition.config
const access = require('./access.js')(definition)

const Access = definition.model({
  name: 'Access',
  sessionOrUserItem: {
    ownerReadAccess: () => true
  },
  relatedToAny: {
    to: 'object',
    readAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAnyAccess(client, params.ownerType, params.owner),
    writeAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params.ownerType, params.owner)
  },
  properties: {
    roles: {
      type: Array,
      of: {
        type: String,
        validation: ['nonEmpty']
      },
      validation: ['elementsNonEmpty']
    }
  }
})

const PublicAccess = definition.model({
  name: "PublicAccess",
  propertyOfAny: {
    to: 'object',
    readAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAnyAccess(client, params.ownerType, params.owner),
    writeAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params.ownerType, params.owner)
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
  },
  indexes: {
  }
})

const AccessRequest = definition.model({
  name: 'AccessRequest',
  sessionOrUserItem: {
  },
  relatedToAny: {
    to: 'object',
    readAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params.ownerType, params.owner)
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

module.exports = { Access, PublicAccess, AccessRequest }
