import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config
import accessModule from'./access.js'
const access = accessModule(definition)

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
  indexes: {
    byOwnerRoleAndObject: {
      property: ['sessionOrUserType', 'sessionOrUser', 'roles', 'objectType', 'object'],
      multi: true
    },
    byObjectExtended: {
      function: async function(input, output, { tableName }) {
        function mapper(access) {
          return access && {
            id: JSON.stringify(access.objectType) + ':' + JSON.stringify(access.object)
              + '_' + sha1(access.id, 'base64'),
            objectType: access.objectType,
            object: access.object,
            sessionOrUserType: access.sessionOrUserType,
            sessionOrUser: access.sessionOrUser,
            roles: access.roles,
            lastUpdate: access.lastUpdate
          }
        }
        const table = await input.table(tableName)
        await table.onChange(
          async (access, oldAccess) => output.change(mapper(access), mapper(oldAccess))
        )
      },
      parameters: {
        tableName: definition.name + '_Access'
      }
    }
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
    readAccess: (params, { client, context, visibilityTest }) => true,
    writeAccess: async (params, { client, context, visibilityTest }) =>
        visibilityTest || access.clientHasAdminAccess(client, params)
  },
  properties: {
    userRoles: rolesArrayType,
    sessionRoles: rolesArrayType,
    availableRoles: rolesArrayType,
    lastUpdate: {
      type: Date
    },
    autoGrantRequests: {
      type: Number,
      default: 0
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
    byOwnerRoleAndObject: {
      property: ['contactOrUserType', 'contactOrUser', 'roles', 'objectType', 'object'],
      multi: true
    }
  }
})

export { Access, PublicAccess, AccessRequest, AccessInvitation, invitationProperties, rolesArrayType }
