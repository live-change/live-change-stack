import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const open = config.readAccess

export const SocialLink = definition.model({
  name: 'SocialLink',
  itemOfAny: {
    to: ['owner'],
    ownerTypes: config.ownerTypes,
    readAccess: open
  },
  properties: {
    platform: {
      type: String,
      validation: ['nonEmpty']
    },
    identifier: {
      type: String,
      validation: ['nonEmpty', { name: 'maxLength', length: 240 }]
    },
    label: {
      type: String,
      validation: [{ name: 'maxLength', length: 80 }]
    }
  }
})

export function prefixStripList(prefix) {
  const list = new Set()
  function add(value) {
    if(!value) return
    list.add(value)
    if(!value.endsWith('/') && !value.endsWith('@')) list.add(value + '/')
  }
  add(prefix)
  try {
    const parsed = new URL(prefix)
    const hosts = new Set([parsed.host])
    const withoutWww = parsed.host.replace(/^www\./, '')
    hosts.add(withoutWww)
    hosts.add(parsed.host.startsWith('www.') ? parsed.host : 'www.' + withoutWww)
    const path = parsed.pathname || '/'
    for(const protocol of ['https:', 'http:']) {
      for(const host of hosts) {
        add(`${protocol}//${host}${path}`)
      }
    }
    for(const host of hosts) {
      add(`${host}${path}`)
      add(`//${host}${path}`)
    }
  } catch(e) {
    add(prefix)
  }
  return [...list].sort((a, b) => b.length - a.length)
}

export function normalizeIdentifier(identifier, spec) {
  let value = String(identifier ?? '').trim()
  if(!value) throw app.logicError('emptyIdentifier')
  if(spec?.prefix) {
    const variants = prefixStripList(spec.prefix)
    const lower = value.toLowerCase()
    for(const variant of variants) {
      if(lower.startsWith(variant.toLowerCase())) {
        value = value.slice(variant.length)
        break
      }
    }
    const cut = Math.min(
      ...['?', '#'].map(ch => {
        const i = value.indexOf(ch)
        return i < 0 ? value.length : i
      })
    )
    value = value.slice(0, cut)
    value = value.replace(/\/+$/, '')
    if(value.includes('/')) value = value.split('/')[0]
    if(spec.prefix.endsWith('@') && value.startsWith('@')) {
      value = value.slice(1)
    }
    value = value.trim()
  }
  if(!value) throw app.logicError('emptyIdentifier')
  return value
}

function platformSpec(platform) {
  const spec = config.platforms?.[platform]
  if(!spec) throw app.logicError('unknownPlatform')
  return spec
}

function assertKnownOwnerType(ownerType) {
  if(!config.ownerTypes.includes(ownerType)) throw app.logicError('unknownOwnerType')
}

function assertLabel(spec, label) {
  if(!spec?.label) return
  if(!String(label || '').trim()) throw app.logicError('emptyLabel')
}

function ownerAccess({ ownerType, owner }, { client, visibilityTest }) {
  if(visibilityTest) return true
  if(client?.internal) return true
  if(ownerType === 'user_User' && owner && owner === client?.user) return true
  return false
}

function existingOwnerAccess(existing, { client }) {
  if(client?.internal) return true
  if(existing.ownerType === 'user_User' && existing.owner === client?.user) return true
  return false
}

const addProperties = {
  ownerType: {
    type: String,
    validation: ['nonEmpty']
  },
  owner: {
    type: String,
    validation: ['nonEmpty']
  },
  platform: {
    type: String,
    validation: ['nonEmpty']
  },
  identifier: {
    type: String,
    validation: ['nonEmpty', { name: 'maxLength', length: 240 }]
  },
  label: {
    type: String,
    validation: [{ name: 'maxLength', length: 80 }]
  }
}

async function executeAdd({ ownerType, owner, platform, identifier, label }, { triggerService }) {
  assertKnownOwnerType(ownerType)
  const spec = platformSpec(platform)
  const normalized = normalizeIdentifier(identifier, spec)
  assertLabel(spec, label)
  return await triggerService({
    service: definition.name,
    type: 'socials_createSocialLink'
  }, {
    ownerType,
    owner,
    platform,
    identifier: normalized,
    label: spec.label ? String(label).trim() : (label ? String(label).trim() : undefined)
  })
}

definition.trigger({
  name: 'addSocialLink',
  properties: addProperties,
  queuedBy: (c) => JSON.stringify([
    'add',
    c.data.ownerType,
    c.data.owner
  ]),
  waitForEvents: true,
  execute: executeAdd
})

definition.action({
  name: 'addSocialLink',
  properties: addProperties,
  access: ownerAccess,
  queuedBy: (c) => {
    const params = c.parameters || c
    return JSON.stringify([
      'add',
      params.ownerType,
      params.owner
    ])
  },
  waitForEvents: true,
  execute: executeAdd
})

const updateProperties = {
  socialLink: {
    type: String,
    validation: ['nonEmpty']
  },
  platform: {
    type: String
  },
  identifier: {
    type: String,
    validation: [{ name: 'maxLength', length: 240 }]
  },
  label: {
    type: String,
    validation: [{ name: 'maxLength', length: 80 }]
  }
}

async function executeUpdate(
  { socialLink, platform, identifier, label },
  { triggerService, client }
) {
  const existing = await SocialLink.get(socialLink)
  if(!existing) throw app.logicError('not_found')
  if(client && !client.internal && !existingOwnerAccess(existing, { client })) {
    throw app.logicError('not_authorized')
  }
  const nextPlatform = platform || existing.platform
  const spec = platformSpec(nextPlatform)
  const nextIdentifier = identifier != null ? identifier : existing.identifier
  const nextLabel = label !== undefined ? label : existing.label
  const normalized = normalizeIdentifier(nextIdentifier, spec)
  assertLabel(spec, nextLabel)
  return await triggerService({
    service: definition.name,
    type: 'socials_updateSocialLink'
  }, {
    socialLink,
    ownerType: existing.ownerType,
    owner: existing.owner,
    platform: nextPlatform,
    identifier: normalized,
    label: spec.label ? String(nextLabel).trim() : (nextLabel ? String(nextLabel).trim() : undefined)
  })
}

definition.trigger({
  name: 'updateSocialLink',
  properties: updateProperties,
  queuedBy: (c) => JSON.stringify(['update', c.data.socialLink]),
  waitForEvents: true,
  execute: executeUpdate
})

definition.action({
  name: 'updateSocialLink',
  properties: updateProperties,
  access: (params, ctx) => {
    if(ctx.client?.internal) return true
    return true
  },
  queuedBy: (c) => {
    const params = c.parameters || c
    return JSON.stringify(['update', params.socialLink])
  },
  waitForEvents: true,
  execute: executeUpdate
})

const removeProperties = {
  socialLink: {
    type: String,
    validation: ['nonEmpty']
  }
}

async function executeRemove({ socialLink }, { triggerService, client }) {
  const existing = await SocialLink.get(socialLink)
  if(!existing) return null
  if(client && !client.internal && !existingOwnerAccess(existing, { client })) {
    throw app.logicError('not_authorized')
  }
  await triggerService({
    service: definition.name,
    type: 'socials_deleteSocialLink'
  }, { socialLink })
  return socialLink
}

definition.trigger({
  name: 'removeSocialLink',
  properties: removeProperties,
  queuedBy: (c) => JSON.stringify(['remove', c.data.socialLink]),
  waitForEvents: true,
  execute: executeRemove
})

definition.action({
  name: 'removeSocialLink',
  properties: removeProperties,
  access: (params, ctx) => {
    if(ctx.client?.internal) return true
    return true
  },
  queuedBy: (c) => {
    const params = c.parameters || c
    return JSON.stringify(['remove', params.socialLink])
  },
  waitForEvents: true,
  execute: executeRemove
})
