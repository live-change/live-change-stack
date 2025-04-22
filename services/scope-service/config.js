import definition from './definition.js'

const {
  objectScopePathsRoles = ['reader', 'writer', 'admin', 'owner'],
  scopeObjectRoles = ['reader', 'writer', 'admin', 'owner'],
  objectScopesRoles = ['reader', 'writer', 'admin', 'owner']
} = definition.config

definition.clientConfig = {
  objectScopePathsRoles: ['reader', 'writer', 'admin', 'owner'],
  scopeObjectRoles: ['reader', 'writer', 'admin', 'owner'],
  objectScopesRoles: ['reader', 'writer', 'admin', 'owner']
}

const config = {
  objectScopePathsRoles,
  scopeObjectRoles,
  objectScopesRoles
}

export default config
