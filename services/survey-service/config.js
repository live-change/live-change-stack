import definition from './definition.js'

const {
  adminRoles = ['admin', 'owner'],
  memberRoles = ['admin', 'owner', 'member'],
} = definition.config

definition.clientConfig = {
}

const config = {
  adminRoles, memberRoles
}

export default config
