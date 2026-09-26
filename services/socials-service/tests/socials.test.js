import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import App from '@live-change/framework'
import { startSocialsTestServer, trigger } from './helpers.js'

const app = App.app()
let server

before(async () => {
  server = await startSocialsTestServer()
  assert.ok(server.url)
})

function socialsService() {
  return server.apiServer.services.services.find(s => s.name == 'socials')
}

function owner(id) {
  return {
    ownerType: 'user_User',
    owner: id
  }
}

async function add(ownerId, platform, identifier, label) {
  return await trigger(app, 'socials', 'addSocialLink', {
    ...owner(ownerId),
    platform,
    identifier,
    label
  })
}

async function update(socialLink, fields) {
  return await trigger(app, 'socials', 'updateSocialLink', {
    socialLink,
    ...fields
  })
}

async function remove(socialLink) {
  return await trigger(app, 'socials', 'removeSocialLink', { socialLink })
}

async function getLink(id) {
  return await socialsService().models.SocialLink.get(id)
}

async function linksByOwner(ownerId) {
  return await socialsService().models.SocialLink.sortedIndexRangeGet('byOwner', [
    'user_User',
    ownerId
  ])
}

test('add instagram handle stores identifier not url', async () => {
  const id = await add('alice', 'instagram', 'nowa_fala')
  const link = await getLink(id)
  assert.equal(link.platform, 'instagram')
  assert.equal(link.identifier, 'nowa_fala')
  const list = await linksByOwner('alice')
  assert.equal(list.length, 1)
})

test('pasted instagram url is stripped to handle', async () => {
  const id = await add('bob', 'instagram', 'https://www.instagram.com/nowa_fala')
  const link = await getLink(id)
  assert.equal(link.identifier, 'nowa_fala')
})

test('two links on one owner with the same platform', async () => {
  await add('carol', 'instagram', 'one')
  await add('carol', 'instagram', 'two')
  const list = await linksByOwner('carol')
  assert.equal(list.length, 2)
})

test('unknown platform throws', async () => {
  await assert.rejects(
    () => add('dana', 'myspace', 'x'),
    /unknownPlatform/
  )
})

test('other without label throws', async () => {
  await assert.rejects(
    () => add('erin', 'other', 'whatever'),
    /emptyLabel/
  )
})

test('website stores the typed string without forcing https', async () => {
  const id = await add('frank', 'website', 'example.com/me')
  const link = await getLink(id)
  assert.equal(link.identifier, 'example.com/me')
})

test('update changes identifier', async () => {
  const id = await add('gina', 'tiktok', '@dance')
  await update(id, { identifier: 'https://www.tiktok.com/@newhandle' })
  const link = await getLink(id)
  assert.equal(link.identifier, 'newhandle')
})

test('remove deletes and is a no-op the second time', async () => {
  const id = await add('hank', 'soundcloud', 'mix')
  const first = await remove(id)
  assert.equal(first, id)
  assert.equal(await getLink(id), null)
  const second = await remove(id)
  assert.equal(second, null)
})
