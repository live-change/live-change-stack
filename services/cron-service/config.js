import definition from './definition.js'

const {
  adminRoles = ['admin', 'owner'],
  readerRoles = ['reader'],
  ownerTypes = ['user_User'],
  topicTypes = undefined
} = definition.config

const config = {
  adminRoles,
  readerRoles,
  ownerTypes,
  topicTypes
} 

export default config