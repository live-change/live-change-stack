import definition from './definition.js'

const {
  objectScopePathsRoles = ['reader', 'writer', 'admin', 'owner']
} = definition.config

definition.clientConfig = {
  objectScopePathsRoles: ['reader', 'writer', 'admin', 'owner']
}

const config = {
  objectScopePathsRoles
}

export default config
