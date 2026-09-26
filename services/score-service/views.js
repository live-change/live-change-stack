import App from '@live-change/framework'

import definition from './definition.js'
import config from './config.js'
import { ScoreEvent } from './scoreEvent.js'
import { RankEntry } from './rank.js'

const open = config.readAccess

definition.view({
  name: 'scoreEventsByRecipient',
  properties: {
    recipientType: {
      type: String,
      validation: ['nonEmpty']
    },
    recipient: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: ScoreEvent
    }
  },
  access: open,
  async daoPath({ recipientType, recipient, ...props }) {
    const range = App.extractRange(props)
    return ScoreEvent.sortedIndexRangePath('byRecipient', [recipientType, recipient], range)
  }
})

definition.view({
  name: 'ranking',
  properties: {
    topicType: {
      type: String,
      default: config.topicType
    },
    topic: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: RankEntry
    }
  },
  access: open,
  async daoPath({ topicType, topic, ...props }) {
    const range = App.extractRange(props)
    return RankEntry.sortedIndexRangePath(
      'byTopicAndPosition',
      [topicType || config.topicType, topic],
      range
    )
  }
})
