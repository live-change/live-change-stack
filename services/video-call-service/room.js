import definition from './definition.js'
const config = definition.config

const {
  adminRoles = ['admin'],
  memberRoles = ['listener', 'speaker', 'owner'],
} = config

export const Room = definition.model({
  name: "Room",
  entity:{
    writeAccessControl: {
      roles: adminRoles
    },
    readAccessControl: {
      roles: [ ...adminRoles, ...memberRoles]
    }
  },
  properties: {
    name: {
      type: String
    },
    description: {
      type: String
    }
  },
  indexes: {
    byName: {
      property: 'name'
    }
  }
})
