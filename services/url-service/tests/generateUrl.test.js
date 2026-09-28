import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import App from '@live-change/framework'
import { startUrlTestServer, trigger } from './helpers.js'

const app = App.app()
let server

before(async () => {
  server = await startUrlTestServer()
  assert.ok(server.url)
})

function urlService() {
  return server.apiServer.services.services.find(s => s.name == 'url')
}

function canonicalId(targetType, target) {
  return App.encodeIdentifier([targetType, target])
}

async function generate(target, title, extra = {}) {
  return await trigger(app, 'url', 'generateUrl', {
    targetType: 'user_User',
    target,
    title,
    ...extra
  })
}

async function getCanonical(target) {
  return await urlService().models.Canonical.get(canonicalId('user_User', target))
}

async function redirectsFor(target) {
  return await urlService().models.Redirect.indexRangeGet('byTarget', [
    'user_User',
    target
  ]) || []
}

test('first title creates canonical slug', async () => {
  const result = await generate('alice', 'Alice')
  assert.equal(result.path, 'alice')
  const row = await getCanonical('alice')
  assert.ok(row)
  assert.equal(row.path, 'alice')
})

test('rename moves canonical and keeps old path as redirect', async () => {
  await generate('renamer', 'Ada Profile')
  await generate('renamer', 'Ada Nowa')
  const row = await getCanonical('renamer')
  assert.equal(row.path, 'ada-nowa')
  const redirects = await redirectsFor('renamer')
  assert.ok(redirects.some(r => r.path === 'ada-profile'))
  assert.equal(redirects.some(r => r.path === 'ada-nowa'), false)
})

test('same title again does not append a suffix', async () => {
  await generate('stable', 'Nav Profile')
  const first = await getCanonical('stable')
  await generate('stable', 'Nav Profile')
  const second = await getCanonical('stable')
  assert.equal(first.path, 'nav-profile')
  assert.equal(second.path, 'nav-profile')
  const redirects = await redirectsFor('stable')
  assert.equal(redirects.filter(r => r.path === 'nav-profile').length, 0)
})

test('two targets with the same title get a suffix on the second', async () => {
  const first = await generate('one-jan', 'Jan Kowalski')
  const second = await generate('two-jan', 'Jan Kowalski')
  assert.equal(first.path, 'jan-kowalski')
  assert.ok(second.path.startsWith('jan-kowalski-'))
  assert.notEqual(second.path, first.path)
})

test('Polish title becomes a latinized canonical path', async () => {
  const result = await generate('lukasz', 'Łukasz Żółć')
  assert.equal(result.path, 'lukasz-zolc')
  const row = await getCanonical('lukasz')
  assert.equal(row.path, 'lukasz-zolc')
})

test('rename back reuses the old slug without leaving it as redirect', async () => {
  await generate('roundtrip', 'First Name')
  await generate('roundtrip', 'Second Name')
  await generate('roundtrip', 'First Name')
  const row = await getCanonical('roundtrip')
  assert.equal(row.path, 'first-name')
  const redirects = await redirectsFor('roundtrip')
  assert.equal(redirects.some(r => r.path === 'first-name'), false)
  assert.ok(redirects.some(r => r.path === 'second-name'))
})

test('old slug is findable as redirect after rename', async () => {
  await generate('redir-user', 'Redir One')
  await generate('redir-user', 'Redir Two')
  const indexed = await urlService().indexes.Urls.rangeGet(['user_User', '', 'redir-one'])
  assert.ok(indexed.length)
  assert.equal(indexed[0].type, 'redirect')
  assert.equal(indexed[0].target, 'redir-user')
})

test('generated slug is findable on the byUrl and Urls indexes', async () => {
  const result = await generate('index-user', 'Index Person')
  const rows = await urlService().models.Canonical.sortedIndexRangeGet('byUrl', [
    'user_User',
    '',
    result.path
  ])
  assert.ok(rows.length)
  assert.equal(rows[0].target, 'index-user')
  const indexed = await urlService().indexes.Urls.rangeGet(['user_User', '', result.path])
  assert.ok(indexed.length)
  assert.equal(indexed[0].target, 'index-user')
  assert.equal(indexed[0].type, 'canonical')
})
