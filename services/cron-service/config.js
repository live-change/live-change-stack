import definition from './definition.js'

const {
  adminRoles = ['admin', 'owner'],
  ownerTypes = ['user_User'],
  topicTypes = ['topic_Topic']
} = definition.config

const config = {
  adminRoles,
  ownerTypes,
  topicTypes
} 

export default config