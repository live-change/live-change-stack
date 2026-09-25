import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

export function normalizeTagName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function tagId(tagType, name) {
  return App.encodeIdentifier([tagType, normalizeTagName(name)])
}

const Tag = definition.model({
  name: 'Tag',
  entity: {
    readAccessControl: {
      roles: []
    },
    writeAccessControl: {
      roles: []
    },
    deleteAccessControl: {
      roles: ['admin']
    }
  },
  properties: {
    tagType: {
      type: String,
      validation: ['nonEmpty'],
      input: 'select',
      options: config.tagTypes
    },
    name: {
      type: String,
      validation: ['nonEmpty', { name: 'maxLength', length: 120 }]
    },
    normalizedName: {
      type: String,
      validation: ['nonEmpty', { name: 'maxLength', length: 120 }]
    }
  },
  indexes: {
    byTagTypeAndNormalizedName: {
      property: ['tagType', 'normalizedName']
    }
  }
})

function assertKnownTagType(tagType) {
  if(!config.tagTypes.includes(tagType)) throw app.logicError('unknownTagType')
}

async function executeEnsureTag({ tagType, name }, { client, service }, emit) {
  assertKnownTagType(tagType)
  const normalizedName = normalizeTagName(name)
  if(!normalizedName.length) throw app.logicError('emptyTagName')
  const id = tagId(tagType, name)
  const existing = await Tag.get(id)
  if(existing) return existing
  const displayName = String(name).trim()
  const data = {
    tagType,
    name: displayName.length ? displayName : normalizedName,
    normalizedName
  }
  emit({
    type: 'TagCreated',
    tag: id,
    data
  })
  return { id, ...data }
}

definition.event({
  name: 'TagCreated',
  async execute({ tag, data }) {
    await Tag.create({
      id: tag,
      ...data
    })
  }
})

const ensureTagProperties = {
  tagType: {
    type: String,
    validation: ['nonEmpty']
  },
  name: {
    type: String,
    validation: ['nonEmpty', { name: 'maxLength', length: 120 }]
  }
}

const ensureTagQueuedBy = (c) => JSON.stringify([
  'ensureTag',
  c.data.tagType,
  normalizeTagName(c.data.name)
])

const ensureTagActionQueuedBy = (c) => JSON.stringify([
  'ensureTag',
  c.tagType,
  normalizeTagName(c.name)
])

definition.trigger({
  name: 'ensureTag',
  properties: ensureTagProperties,
  returns: {
    type: Tag
  },
  queuedBy: ensureTagQueuedBy,
  waitForEvents: true,
  execute: executeEnsureTag
})

definition.action({
  name: 'ensureTag',
  properties: ensureTagProperties,
  returns: {
    type: Tag
  },
  queuedBy: ensureTagActionQueuedBy,
  waitForEvents: true,
  execute: executeEnsureTag
})

definition.view({
  name: 'tagsByTypeAndPrefix',
  properties: {
    tagType: {
      type: String,
      validation: ['nonEmpty']
    },
    prefix: {
      type: String,
      default: ''
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Tag
    }
  },
  async daoPath(props, { client, service }, method) {
    const { tagType, prefix } = props
    const range = App.utils.extractRange(props)
    const namePrefix = normalizeTagName(prefix)
    const pathRange = App.utils.prefixRangePartial(
      range,
      `${JSON.stringify(tagType)}:${JSON.stringify(namePrefix).slice(0, -1)}`,
      `${JSON.stringify(tagType)}:${JSON.stringify(namePrefix).slice(0, -1)}`
    )
    return Tag.sortedIndexRangePath('byTagTypeAndNormalizedName', [tagType], pathRange)
  }
})

definition.beforeStart(async () => {
  for(const item of config.seedTags) {
    if(!item?.tagType || item.name == null) continue
    await app.triggerService({
      service: definition.name,
      type: 'ensureTag',
      client: { internal: true }
    }, item)
  }
})

export { Tag }
