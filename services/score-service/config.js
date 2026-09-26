import definition from './definition.js'

const open = () => true

const {
  recipientTypes = ['user_User'],
  causeTypes: causeTypeRules = {},
  counters = {},
  topicType = 'score_Counter',
  topicTypes = ['score_Counter'],
  readAccess = open
} = definition.config || {}

const causeTypes = Array.isArray(causeTypeRules)
  ? causeTypeRules
  : Object.keys(causeTypeRules || {})

const rankedTopics = Object.entries(counters)
  .filter(([, spec]) => spec?.ranked)
  .map(([key]) => key)

definition.clientConfig = {
  recipientTypes,
  causeTypes,
  counters,
  topicType,
  topicTypes
}

export default {
  recipientTypes,
  causeTypeRules: Array.isArray(causeTypeRules) ? {} : (causeTypeRules || {}),
  causeTypes,
  counters,
  topicType,
  topicTypes,
  rankedTopics,
  readAccess
}
