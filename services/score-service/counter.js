import { generateAnyId, generateId } from '@live-change/relations-plugin/src/idGeneration.js'

import definition from './definition.js'
import config from './config.js'
import { ScoreEvent } from './scoreEvent.js'

const open = config.readAccess

export const ScoreCounter = definition.model({
  name: 'ScoreCounter',
  propertyOfAny: {
    to: ['recipient', 'topic'],
    recipientTypes: config.recipientTypes,
    topicTypes: config.topicTypes,
    hashId: true,
    readAccess: open
  },
  properties: {
    score: {
      type: Number,
      validation: ['nonEmpty']
    }
  }
})

export const ScoreCredit = definition.model({
  name: 'ScoreCredit',
  propertyOf: {
    what: [ScoreEvent, ScoreCounter],
    readAccess: open
  },
  properties: {
    score: {
      type: Number,
      validation: ['nonEmpty']
    }
  }
})

const counterIdConfig = { hashId: true }

export function scoreCounterId(identifiers) {
  return generateAnyId(['recipient', 'topic'], identifiers, counterIdConfig)
}

export function scoreCreditId(identifiers) {
  return generateId(['scoreEvent', 'scoreCounter'], identifiers)
}

definition.trigger({
  name: 'creditCounter',
  properties: {
    scoreEvent: {
      type: String,
      validation: ['nonEmpty']
    },
    recipientType: {
      type: String,
      validation: ['nonEmpty']
    },
    recipient: {
      type: String,
      validation: ['nonEmpty']
    },
    topicType: {
      type: String,
      validation: ['nonEmpty']
    },
    topic: {
      type: String,
      validation: ['nonEmpty']
    },
    score: {
      type: Number,
      validation: ['nonEmpty']
    },
    createdAt: {
      type: Date
    },
    ranked: {
      type: Boolean
    }
  },
  queuedBy: ['topicType', 'topic', 'recipientType', 'recipient'],
  waitForEvents: true,
  async execute({
    scoreEvent, recipientType, recipient, topicType, topic, score, createdAt, ranked
  }, { triggerService }, emit) {
    const counterIdentifiers = { recipientType, recipient, topicType, topic }
    const counterId = scoreCounterId(counterIdentifiers)
    const creditIdentifiers = { scoreEvent, scoreCounter: counterId }
    const creditId = scoreCreditId(creditIdentifiers)
    const existingCredit = await ScoreCredit.get(creditId)
    if(existingCredit) return counterId

    const existingCounter = await ScoreCounter.get(counterId)
    const newScore = (existingCounter?.score || 0) + score
    emit({
      type: existingCounter ? 'ScoreCounterUpdated' : 'ScoreCounterSet',
      identifiers: counterIdentifiers,
      data: { score: newScore }
    })
    emit({
      type: 'ScoreCreditSet',
      identifiers: creditIdentifiers,
      data: { score }
    })

    if(ranked) {
      await triggerService({
        service: definition.name,
        type: 'updateRank'
      }, {
        recipientType,
        recipient,
        topicType,
        topic,
        score: newScore,
        tieBreak: createdAt
      })
    }

    return counterId
  }
})
