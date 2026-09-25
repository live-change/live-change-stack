import test from 'tape'
import { rimrafSync } from 'rimraf'
import fs from 'fs'
import Server from '../lib/Server.js'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function createTestServer(dbRoot) {
  rimrafSync(dbRoot)
  await fs.promises.mkdir(dbRoot)
  const server = new Server({
    backend: process.env.DB_BACKEND || 'lmdb',
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  return server
}

test('rebuildIndex cascades to dependent indexes', async t => {
  t.plan(4)
  const dbRoot = 'test-index-cascade-rebuild.db'
  const dbName = 'index-cascade.test'
  const server = await createTestServer(dbRoot)
  const dao = server.createDao('index-cascade')

  await dao.request(['database', 'createDatabase'], dbName)
  await dao.request(['database', 'createTable'], dbName, 'users')
  await dao.request(['database', 'createIndex'], dbName, 'byName', `(${
    async function(input, output) {
      const mapper = (obj) => obj && { id: obj.name + '_' + obj.id, to: obj.id }
      await input.table('users').onChange((obj, oldObj) =>
        output.change(mapper(obj), mapper(oldObj)))
    }
  })`)
  await dao.request(['database', 'createIndex'], dbName, 'copyFromByName', `(${
    async function(input, output) {
      const mapper = (obj) => obj && { id: obj.id, to: obj.to }
      await input.index('byName').onChange((obj, oldObj) =>
        output.change(mapper(obj), mapper(oldObj)))
    }
  })`)
  await dao.request(['database', 'put'], dbName, 'users', { id: '1', name: 'ada' })
  await delay(400)

  const before = await dao.get(['database', 'indexRange', dbName, 'copyFromByName', {}])
  t.ok(before.some(row => row.id === 'ada_1'), 'copy index has source row')

  const copyIndex = server.databases.get(dbName).indexes.get('copyFromByName')
  await copyIndex.put({ id: 'stale_row', to: 'ghost' })
  const withStale = await dao.get(['database', 'indexRange', dbName, 'copyFromByName', {}])
  t.ok(withStale.some(row => row.id === 'stale_row'), 'stale row injected')

  await dao.request(['database', 'rebuildIndex'], dbName, 'byName')
  await delay(1500)

  const after = await dao.get(['database', 'indexRange', dbName, 'copyFromByName', {}])
  t.ok(after.some(row => row.id === 'ada_1'), 'copy index rebuilt with source row')
  t.notOk(after.some(row => row.id === 'stale_row'), 'stale row cleared by cascade rebuild')

  await server.close()
  await new Promise(resolve => setTimeout(resolve, 50))
  rimrafSync(dbRoot)
})
