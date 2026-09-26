import App from '@live-change/framework'
const app = App.app()

import { generateAnyId } from '@live-change/relations-plugin/src/idGeneration.js'

import definition from './definition.js'
import config from './config.js'

const open = config.readAccess

export const Unlock = definition.model({
  name: 'Unlock',
  propertyOfAny: {
    to: ['recipient', 'topic'],
    recipientTypes: config.recipientTypes,
    topicTypes: config.unlockTopicTypes,
    hashId: true,
    readAccess: open
  },
  properties: {
    score: {
      type: Number,
      validation: ['nonEmpty']
    },
    category: {
      type: String,
      validation: ['nonEmpty']
    },
    priority: {
      type: Number
    },
    unlockedAt: {
      type: Date
    }
  }
})

const unlockIdConfig = { hashId: true }

export function unlockId({ recipientType, recipient, code }) {
  return generateAnyId(['recipient', 'topic'], {
    recipientType,
    recipient,
    topicType: config.unlockTopicType,
    topic: code
  }, unlockIdConfig)
}

definition.trigger({
  name: 'unlockAchievement',
  properties: {
    recipientType: {
      type: String,
      validation: ['nonEmpty']
    },
    recipient: {
      type: String,
      validation: ['nonEmpty']
    },
    code: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  queuedBy: (c) => JSON.stringify([
    'unlock',
    c.data.recipientType,
    c.data.recipient,
    c.data.code
  ]),
  waitForEvents: true,
  async execute({ recipientType, recipient, code }, { triggerService }) {
    const spec = config.achievements[code]
    if(!spec) throw app.logicError('unknownAchievement')
    const identifiers = {
      recipientType,
      recipient,
      topicType: config.unlockTopicType,
      topic: code
    }
    const id = unlockId({ recipientType, recipient, code })
    const existing = await Unlock.get(id)
    if(existing) return existing.id

    const createdId = await triggerService({
      service: definition.name,
      type: 'achievement_setUnlock'
    }, {
      ...identifiers,
      score: spec.score,
      category: spec.category,
      priority: spec.priority,
      unlockedAt: new Date()
    })

    await triggerService({
      service: 'score',
      type: 'recordScore'
    }, {
      recipientType,
      recipient,
      causeType: 'achievement_Unlock',
      cause: createdId
    })

    return createdId
  }
})
