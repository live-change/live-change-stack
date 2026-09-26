import { generateAnyId } from '@live-change/relations-plugin/src/idGeneration.js'

import definition from './definition.js'
import config from './config.js'

const open = config.readAccess

export const RankEntry = definition.model({
  name: 'RankEntry',
  propertyOfAny: {
    to: ['recipient', 'topic'],
    recipientTypes: config.recipientTypes,
    topicTypes: config.topicTypes,
    readAccess: open
  },
  properties: {
    score: {
      type: Number,
      validation: ['nonEmpty']
    },
    position: {
      type: Number,
      validation: ['nonEmpty']
    },
    tieBreak: {
      type: Date
    }
  },
  indexes: {
    byTopicAndPosition: {
      function: async (input, output, { tableName }) => {
        const table = await input.table(tableName)
        await table.map(obj => {
          if(!obj) return null
          const position = String(obj.position).padStart(10, '0')
          return {
            id: [obj.topicType, obj.topic, position].map(v => JSON.stringify(v)).join(':')
              + '_' + obj.id,
            to: obj.id
          }
        }).to(output)
      },
      parameters: {
        tableName: definition.name + '_RankEntry'
      }
    }
  }
})

const boards = new Map()

function boardKey(topicType, topic) {
  return JSON.stringify([topicType, topic])
}

function recipientKey(recipientType, recipient) {
  return JSON.stringify([recipientType, recipient])
}

function iso(value) {
  if(!value) return ''
  if(value instanceof Date) return value.toISOString()
  return String(value)
}

function compareEntries(a, b) {
  if(a.score != b.score) return b.score - a.score
  const aTie = iso(a.tieBreak)
  const bTie = iso(b.tieBreak)
  if(aTie != bTie) return aTie < bTie ? -1 : 1
  if(a.id != b.id) return a.id < b.id ? -1 : 1
  return 0
}

function getBoard(topicType, topic) {
  const key = boardKey(topicType, topic)
  let board = boards.get(key)
  if(!board) {
    board = { entries: [], byRecipient: new Map() }
    boards.set(key, board)
  }
  return board
}

function countAbove(board, entry) {
  let above = 0
  for(const other of board.entries) {
    if(other === entry) continue
    if(compareEntries(other, entry) < 0) above++
  }
  return above
}

function persistEntry(emit, entry, isNew) {
  emit({
    type: isNew ? 'RankEntrySet' : 'RankEntryUpdated',
    identifiers: {
      recipientType: entry.recipientType,
      recipient: entry.recipient,
      topicType: entry.topicType,
      topic: entry.topic
    },
    data: {
      score: entry.score,
      position: entry.position,
      tieBreak: entry.tieBreak
    }
  })
}

export function applyScoreOnBoard(board, {
  id, recipientType, recipient, topicType, topic, score, tieBreak
}) {
  const key = recipientKey(recipientType, recipient)
  let entry = board.byRecipient.get(key)
  const isNew = !entry
  if(!entry) {
    entry = {
      id,
      recipientType,
      recipient,
      topicType,
      topic,
      score,
      position: 0,
      tieBreak
    }
    board.byRecipient.set(key, entry)
  } else {
    entry.score = score
  }

  const oldIndex = isNew ? -1 : board.entries.indexOf(entry)
  const newIndex = countAbove(board, entry)
  const changed = []

  if(isNew) {
    board.entries.splice(newIndex, 0, entry)
    entry.position = newIndex + 1
    for(let i = newIndex + 1; i < board.entries.length; i++) {
      board.entries[i].position = i + 1
      changed.push(board.entries[i])
    }
    return { self: entry, isNew: true, jumped: changed }
  }

  if(newIndex == oldIndex) {
    return { self: entry, isNew: false, jumped: [] }
  }

  const jumped = board.entries.slice(newIndex, oldIndex)
  board.entries.splice(oldIndex, 1)
  board.entries.splice(newIndex, 0, entry)
  entry.position = newIndex + 1
  for(const other of jumped) other.position += 1
  return { self: entry, isNew: false, jumped }
}

async function loadTopicEntries(topicType, topic) {
  const collected = []
  let gt = ''
  while(true) {
    const bucket = await RankEntry.sortedIndexRangeGet('byTopic', [topicType, topic], {
      gt,
      limit: 128
    })
    if(!bucket.length) break
    for(const row of bucket) {
      const id = row.to || row.id
      const object = row.recipientType ? row : await RankEntry.get(id)
      if(!object) continue
      collected.push({
        id: object.id || id,
        recipientType: object.recipientType,
        recipient: object.recipient,
        topicType: object.topicType || topicType,
        topic: object.topic || topic,
        score: object.score,
        position: object.position,
        tieBreak: object.tieBreak
      })
    }
    gt = bucket[bucket.length - 1].id
    if(bucket.length < 128) break
  }
  return collected
}

export async function rebuildBoard(topicType, topic, emit) {
  const rows = await loadTopicEntries(topicType, topic)
  rows.sort(compareEntries)
  const board = { entries: [], byRecipient: new Map() }
  boards.set(boardKey(topicType, topic), board)
  const changed = []
  for(let i = 0; i < rows.length; i++) {
    const entry = rows[i]
    const position = i + 1
    if(entry.position != position) {
      entry.position = position
      changed.push(entry)
    } else {
      entry.position = position
    }
    board.entries.push(entry)
    board.byRecipient.set(recipientKey(entry.recipientType, entry.recipient), entry)
  }
  if(emit) {
    for(const entry of changed) persistEntry(emit, entry, false)
  }
  return changed
}

export async function rebuildAllBoards(emit) {
  const changed = []
  for(const topic of config.rankedTopics) {
    const boardChanges = await rebuildBoard(config.topicType, topic, emit)
    changed.push(...boardChanges)
  }
  return changed
}

definition.beforeStart(async () => {
  const changed = await rebuildAllBoards(null)
  for(const entry of changed) {
    await RankEntry.update(entry.id, { position: entry.position })
  }
})

definition.trigger({
  name: 'rebuildRank',
  properties: {
    topicType: {
      type: String
    },
    topic: {
      type: String
    }
  },
  queuedBy: (trig) => JSON.stringify([
    trig.data?.topicType || config.topicType,
    trig.data?.topic || ''
  ]),
  waitForEvents: true,
  async execute({ topicType, topic }, { }, emit) {
    const type = topicType || config.topicType
    if(topic) {
      return await rebuildBoard(type, topic, emit)
    }
    return await rebuildAllBoards(emit)
  }
})

definition.trigger({
  name: 'updateRank',
  properties: {
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
    tieBreak: {
      type: Date
    }
  },
  queuedBy: ['topicType', 'topic'],
  waitForEvents: true,
  async execute({ recipientType, recipient, topicType, topic, score, tieBreak }, { }, emit) {
    const identifiers = { recipientType, recipient, topicType, topic }
    const id = generateAnyId(['recipient', 'topic'], identifiers)
    const board = getBoard(topicType, topic)
    const result = applyScoreOnBoard(board, {
      id,
      ...identifiers,
      score,
      tieBreak: tieBreak || new Date()
    })
    persistEntry(emit, result.self, result.isNew)
    for(const jumped of result.jumped) persistEntry(emit, jumped, false)
    return result.self.position
  }
})
