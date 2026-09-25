import definition from './definition.js'

const open = () => true

const {
  tagTypes = ['hardSkill', 'softSkill', 'keyValue'],
  ownerTypes = ['user_User'],
  seedTags = [],
  readAccess = open
} = definition.config || {}

definition.clientConfig = {
  tagTypes,
  ownerTypes,
  seedTags
}

export default {
  tagTypes,
  ownerTypes,
  seedTags,
  readAccess
}
