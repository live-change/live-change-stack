import definition from './definition.js'

const {
  taskReaderRoles = ['admin', 'owner', 'reader'],
} = definition.config

const config = {
  taskReaderRoles
}

export default config
