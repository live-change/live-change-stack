import App from '@live-change/framework'
const app = App.app()

import { generateAnyId } from '@live-change/relations-plugin/src/idGeneration.js'

import definition from './definition.js'
import config from './config.js'
import { normalizeTagName, tagId } from './tag.js'

const open = config.readAccess

export const TAG_PARENT_TYPE = 'tags_Tag'

const taggedIdConfig = { hashId: true }

export const Tagged = definition.model({
  name: 'Tagged',
  propertyOfAny: {
    to: ['owner', 'tag'],
    ownerTypes: config.ownerTypes,
    tagTypes: [TAG_PARENT_TYPE],
    hashId: true,
    readAccess: open
  }
})

export function taggedId({ ownerType, owner, tag }) {
  return generateAnyId(['owner', 'tag'], {
    ownerType,
    owner,
    tagType: TAG_PARENT_TYPE,
    tag
  }, taggedIdConfig)
}

function assertKnownOwnerType(ownerType) {
  if(!config.ownerTypes.includes(ownerType)) throw app.logicError('unknownOwnerType')
}

function assertKnownTagType(tagType) {
  if(!config.tagTypes.includes(tagType)) throw app.logicError('unknownTagType')
}

function ownerAccess({ ownerType, owner }, { client, visibilityTest }) {
  if(visibilityTest) return true
  if(client?.internal) return true
  if(ownerType === 'user_User' && owner && owner === client?.user) return true
  return false
}

function resolveTagId({ tag, tagType, name }) {
  if(tag) return tag
  if(!tagType || name == null || name === '') throw app.logicError('emptyTagName')
  return tagId(tagType, name)
}

const tagProperties = {
  ownerType: {
    type: String,
    validation: ['nonEmpty']
  },
  owner: {
    type: String,
    validation: ['nonEmpty']
  },
  tagType: {
    type: String,
    validation: ['nonEmpty']
  },
  name: {
    type: String,
    validation: ['nonEmpty', { name: 'maxLength', length: 120 }]
  }
}

async function executeTag({ ownerType, owner, tagType, name }, { triggerService }) {
  assertKnownOwnerType(ownerType)
  assertKnownTagType(tagType)
  const ensured = await triggerService({
    service: definition.name,
    type: 'ensureTag'
  }, { tagType, name })
  const tag = ensured.id
  const identifiers = {
    ownerType,
    owner,
    tagType: TAG_PARENT_TYPE,
    tag
  }
  const id = taggedId({ ownerType, owner, tag })
  const existing = await Tagged.get(id)
  if(existing) return existing.id
  return await triggerService({
    service: definition.name,
    type: 'tags_setTagged'
  }, identifiers)
}

definition.trigger({
  name: 'tag',
  properties: tagProperties,
  queuedBy: (c) => JSON.stringify([
    'tag',
    c.data.ownerType,
    c.data.owner,
    c.data.tagType,
    normalizeTagName(c.data.name)
  ]),
  waitForEvents: true,
  execute: executeTag
})

definition.action({
  name: 'tag',
  properties: tagProperties,
  access: ownerAccess,
  queuedBy: (c) => {
    const params = c.parameters || c
    return JSON.stringify([
      'tag',
      params.ownerType,
      params.owner,
      params.tagType,
      normalizeTagName(params.name)
    ])
  },
  waitForEvents: true,
  execute: executeTag
})

const untagProperties = {
  ownerType: {
    type: String,
    validation: ['nonEmpty']
  },
  owner: {
    type: String,
    validation: ['nonEmpty']
  },
  tag: {
    type: String
  },
  tagType: {
    type: String
  },
  name: {
    type: String
  }
}

async function executeUntag({ ownerType, owner, tag, tagType, name }, { triggerService }) {
  assertKnownOwnerType(ownerType)
  const tagRecordId = resolveTagId({ tag, tagType, name })
  const identifiers = {
    ownerType,
    owner,
    tagType: TAG_PARENT_TYPE,
    tag: tagRecordId
  }
  const id = taggedId({ ownerType, owner, tag: tagRecordId })
  const existing = await Tagged.get(id)
  if(!existing) return null
  await triggerService({
    service: definition.name,
    type: 'tags_resetTagged'
  }, identifiers)
  return id
}

definition.trigger({
  name: 'untag',
  properties: untagProperties,
  queuedBy: (c) => JSON.stringify([
    'untag',
    c.data.ownerType,
    c.data.owner,
    resolveTagId(c.data)
  ]),
  waitForEvents: true,
  execute: executeUntag
})

definition.action({
  name: 'untag',
  properties: untagProperties,
  access: ownerAccess,
  queuedBy: (c) => {
    const params = c.parameters || c
    return JSON.stringify([
      'untag',
      params.ownerType,
      params.owner,
      resolveTagId(params)
    ])
  },
  waitForEvents: true,
  execute: executeUntag
})
