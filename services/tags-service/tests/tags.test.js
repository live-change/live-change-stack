import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import App from '@live-change/framework'
import { startTagsTestServer, trigger } from './helpers.js'
import { generateAnyId } from '@live-change/relations-plugin/src/idGeneration.js'

const app = App.app()
let server

before(async () => {
  server = await startTagsTestServer()
  assert.ok(server.url)
})

function tagsService() {
  return server.apiServer.services.services.find(s => s.name == 'tags')
}

function owner(id) {
  return {
    ownerType: 'user_User',
    owner: id
  }
}

function tagRecordId(tagType, name) {
  return App.encodeIdentifier([tagType, String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')])
}

function taggedRecordId(ownerId, tag) {
  return generateAnyId(['owner', 'tag'], {
    ...owner(ownerId),
    tagType: 'tags_Tag',
    tag
  }, { hashId: true })
}

async function ensureTag(tagType, name) {
  return await trigger(app, 'tags', 'ensureTag', { tagType, name })
}

async function tagOwner(ownerId, tagType, name) {
  return await trigger(app, 'tags', 'tag', {
    ...owner(ownerId),
    tagType,
    name
  })
}

async function untagOwner(ownerId, tagType, name) {
  return await trigger(app, 'tags', 'untag', {
    ...owner(ownerId),
    tagType,
    name
  })
}

async function getTag(tagType, name) {
  return await tagsService().models.Tag.get(tagRecordId(tagType, name))
}

async function getTagged(ownerId, tag) {
  return await tagsService().models.Tagged.get(taggedRecordId(ownerId, tag))
}

async function taggedByOwner(ownerId) {
  return await tagsService().models.Tagged.sortedIndexRangeGet('byOwner', [
    'user_User',
    ownerId
  ])
}

test('seed creates catalog tag', async () => {
  const tag = await getTag('profession', 'dance')
  assert.ok(tag)
  assert.equal(tag.name, 'dance')
  assert.equal(tag.tagType, 'profession')
})

test('ensureTag second call returns the same id and folds case', async () => {
  const first = await ensureTag('profession', 'playingInstrument')
  const second = await ensureTag('profession', 'PlayingInstrument')
  assert.equal(first.id, second.id)
  const tag = await getTag('profession', 'playingInstrument')
  assert.equal(tag.id, first.id)
  assert.equal(tag.name, 'playingInstrument')
})

test('unknown tagType throws', async () => {
  await assert.rejects(
    () => ensureTag('hardSkill', 'foo'),
    /unknownTagType/
  )
})

test('tag on a user is idempotent', async () => {
  const first = await tagOwner('alice', 'profession', 'singing')
  const second = await tagOwner('alice', 'profession', 'singing')
  assert.equal(first, second)
  const tag = await getTag('profession', 'singing')
  const tagged = await getTagged('alice', tag.id)
  assert.ok(tagged)
  assert.equal(tagged.owner, 'alice')
  assert.equal(tagged.tag, tag.id)
})

test('same tag on two owners and two tags on one owner', async () => {
  await tagOwner('bob', 'profession', 'theatre')
  await tagOwner('carol', 'profession', 'theatre')
  await tagOwner('bob', 'profession', 'directing')
  const theatre = await getTag('profession', 'theatre')
  const directing = await getTag('profession', 'directing')
  assert.ok(await getTagged('bob', theatre.id))
  assert.ok(await getTagged('carol', theatre.id))
  assert.ok(await getTagged('bob', directing.id))
  const bobTags = await taggedByOwner('bob')
  assert.equal(bobTags.length, 2)
})

test('untag removes the pair and is a no-op the second time', async () => {
  await tagOwner('dana', 'profession', 'lighting')
  const tag = await getTag('profession', 'lighting')
  const first = await untagOwner('dana', 'profession', 'lighting')
  assert.ok(first)
  assert.equal(await getTagged('dana', tag.id), null)
  const second = await untagOwner('dana', 'profession', 'lighting')
  assert.equal(second, null)
})
