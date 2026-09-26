import App from '@live-change/framework'
const app = App.app()

import { generateAnyId } from '@live-change/relations-plugin/src/idGeneration.js'

import definition from './definition.js'
import config from './config.js'

const open = config.readAccess

export const ScoreEvent = definition.model({
  name: 'ScoreEvent',
  propertyOfAny: {
    to: ['recipient', 'cause'],
    recipientTypes: config.recipientTypes,
    causeTypes: config.causeTypes,
    hashId: true,
    readAccess: open
  },
  properties: {
    category: {
      type: String,
      validation: ['nonEmpty']
    },
    score: {
      type: Number,
      validation: ['nonEmpty']
    },
    createdAt: {
      type: Date
    }
  }
})

const scoreEventIdConfig = { hashId: true }

export function scoreEventId(identifiers) {
  return generateAnyId(['recipient', 'cause'], identifiers, scoreEventIdConfig)
}

async function resolveAward(causeType, cause) {
  const rule = config.causeTypeRules[causeType]
  if(!rule) throw app.logicError('unknownCauseType')
  if(rule.scoreProperty) {
    const object = await app.dao.get(['database', 'tableObject', app.databaseName, causeType, cause])
    if(!object) throw app.logicError('causeNotFound')
    const score = object[rule.scoreProperty]
    if(typeof score != 'number') throw app.logicError('invalidCauseScore')
    return {
      category: rule.category,
      score
    }
  }
  if(typeof rule.score != 'number') throw app.logicError('invalidCauseScore')
  return {
    category: rule.category,
    score: rule.score
  }
}

export function matchingCounters(category) {
  return Object.entries(config.counters)
    .filter(([, spec]) => Array.isArray(spec?.categories) && spec.categories.includes(category))
    .map(([topic, spec]) => ({
      topic,
      ranked: !!spec.ranked
    }))
}

definition.trigger({
  name: 'recordScore',
  properties: {
    recipientType: {
      type: String,
      validation: ['nonEmpty']
    },
    recipient: {
      type: String,
      validation: ['nonEmpty']
    },
    causeType: {
      type: String,
      validation: ['nonEmpty']
    },
    cause: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  queuedBy: ['recipientType', 'recipient', 'causeType', 'cause'],
  waitForEvents: true,
  async execute({ recipientType, recipient, causeType, cause }, { triggerService }) {
    const identifiers = { recipientType, recipient, causeType, cause }
    const id = scoreEventId(identifiers)
    const existing = await ScoreEvent.get(id)
    if(existing) return existing.id
    const award = await resolveAward(causeType, cause)
    return await triggerService({
      service: definition.name,
      type: 'score_setScoreEvent'
    }, {
      ...identifiers,
      category: award.category,
      score: award.score,
      createdAt: new Date()
    })
  }
})

definition.trigger({
  name: 'changeScore_ScoreEvent',
  properties: {
    object: {
      type: String
    },
    identifiers: {
      type: Object
    },
    data: {
      type: Object
    },
    oldData: {
      type: Object
    }
  },
  waitForEvents: true,
  async execute({ object, identifiers, data, oldData }, { triggerService }) {
    if(!data || oldData) return
    const counters = matchingCounters(data.category)
    for(const counter of counters) {
      await triggerService({
        service: definition.name,
        type: 'creditCounter'
      }, {
        scoreEvent: object,
        recipientType: identifiers.recipientType,
        recipient: identifiers.recipient,
        topicType: config.topicType,
        topic: counter.topic,
        score: data.score,
        createdAt: data.createdAt,
        ranked: counter.ranked
      })
    }
  }
})

export { scoreEventIdConfig }
