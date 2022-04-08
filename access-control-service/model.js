const definition = require('./definition.js')
const config = definition.config
const access = require('./access.js')(definition)

const Access = definition.model({
  name: 'Access',
  sessionOrUserProperty: {
    extendedWith: ['object'],
    ownerReadAccess: () => true,
    readAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAnyAccess(client, params.objectType, params.object),
    updateAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params.objectType, params.object),
    resetAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params.objectType, params.object)
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
        visibilityTest || access.clientHasAnyAccess(client, params.objectType, params.object),
    writeAccess: (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params.objectType, params.object)
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
    lastUpdate: {
      type: Date
    }
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
        visibilityTest || access.clientHasAdminAccess(client, params.objectType, params.object)
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


const AccessInvite = definition.model({
  name: 'AccessInvite',
  contactOrUserItem: {},
  relatedToAny: {
    to: 'object',
    readAccess: (params, {client, context, visibilityTest}) =>
        visibilityTest || access.clientHasAdminAccess(client, params.objectType, params.object)
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

module.exports = { Access, PublicAccess, AccessRequest, AccessInvite }
