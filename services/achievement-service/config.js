import definition from './definition.js'

const open = () => true

const {
  recipientTypes = ['user_User'],
  topicType = 'achievement_Metric',
  unlockTopicType = 'achievement_Code',
  achievements = {},
  readAccess = open
} = definition.config || {}

const topicTypes = [topicType]
const unlockTopicTypes = [unlockTopicType]

const achievementsByMetric = {}
for(const [code, spec] of Object.entries(achievements)) {
  const metric = spec?.metric
  if(!metric) continue
  if(!achievementsByMetric[metric]) achievementsByMetric[metric] = []
  achievementsByMetric[metric].push({ code, ...spec })
}

definition.clientConfig = {
  recipientTypes,
  topicType,
  unlockTopicType,
  achievements
}

export default {
  recipientTypes,
  topicType,
  unlockTopicType,
  topicTypes,
  unlockTopicTypes,
  achievements,
  achievementsByMetric,
  readAccess
}
