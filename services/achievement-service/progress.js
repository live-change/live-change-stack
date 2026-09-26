import { generateAnyId } from '@live-change/relations-plugin/src/idGeneration.js'

import definition from './definition.js'
import config from './config.js'

const open = config.readAccess

export const Progress = definition.model({
  name: 'Progress',
  propertyOfAny: {
    to: ['recipient', 'topic'],
    recipientTypes: config.recipientTypes,
    topicTypes: config.topicTypes,
    readAccess: open
  },
  properties: {
    value: {
      type: Number,
      validation: ['nonEmpty']
    }
  }
})

export function progressId({ recipientType, recipient, metric }) {
  return generateAnyId(['recipient', 'topic'], {
    recipientType,
    recipient,
    topicType: config.topicType,
    topic: metric
  })
}

function achievementsForMetric(metric, value) {
  const list = config.achievementsByMetric[metric] || []
  return list.filter(spec => spec.threshold <= value)
}

definition.trigger({
  name: 'setProgress',
  properties: {
    recipientType: {
      type: String,
      validation: ['nonEmpty']
    },
    recipient: {
      type: String,
      validation: ['nonEmpty']
    },
    metric: {
      type: String,
      validation: ['nonEmpty']
    },
    value: {
      type: Number,
      validation: ['nonEmpty']
    }
  },
  queuedBy: (c) => JSON.stringify([
    'setProgress',
    c.data.recipientType,
    c.data.recipient,
    c.data.metric
  ]),
  waitForEvents: true,
  async execute({ recipientType, recipient, metric, value }, { triggerService }) {
    if(typeof value != 'number' || value < 0) throw new Error('invalidProgressValue')
    const identifiers = {
      recipientType,
      recipient,
      topicType: config.topicType,
      topic: metric
    }
    const id = progressId({ recipientType, recipient, metric })
    const existing = await Progress.get(id)
    if(!existing) {
      await triggerService({
        service: definition.name,
        type: 'achievement_setProgress'
      }, {
        ...identifiers,
        value
      })
    } else if(existing.value != value) {
      await triggerService({
        service: definition.name,
        type: 'achievement_updateProgress'
      }, {
        ...identifiers,
        value
      })
    }

    const due = achievementsForMetric(metric, value)
    const unlockIds = []
    for(const spec of due) {
      const unlockId = await triggerService({
        service: definition.name,
        type: 'unlockAchievement'
      }, {
        recipientType,
        recipient,
        code: spec.code
      })
      unlockIds.push(unlockId)
    }
    return { progress: id, unlocks: unlockIds }
  }
})
