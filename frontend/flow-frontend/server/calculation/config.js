import definition from './definition.js'

const open = () => true

const {
  readAccess = open,
  writeAccess = open
} = definition.config || {}

definition.clientConfig = {}

export default {
  readAccess,
  writeAccess
}
