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

test('index sleep on missing dependencies', async t => {
  t.plan(11)
  const dbRoot = 'test-index-sleep.db'
  const dbName = 'index-sleep.test'
  const server = await createTestServer(dbRoot)
  const dao = server.createDao('index-sleep')

  await dao.request(['database', 'createDatabase'], dbName)

  await dao.request(['database', 'createIndex'], dbName, 'byName', `(${
    async function(input, output) {
      const mapper = (obj) => ({ id: obj.name + '_' + obj.id, to: obj.id })
      await input.table('users').onChange((obj, oldObj) =>
        output.change(obj && mapper(obj), oldObj && mapper(oldObj)))
    }
  })`)
  await delay(200)

  const indexes = await dao.get(['database', 'indexesList', dbName])
  t.ok(indexes.includes('byName'), 'index remains in config')

  const state = await dao.get(['database', 'indexState', dbName, 'byName'])
  t.equal(state?.status, 'sleeping', 'indexState is sleeping')
  t.equal(state?.failedOn?.type, 'table', 'failedOn type is table')
  t.equal(state?.failedOn?.name, 'users', 'failedOn name is users')

  const config = await dao.get(['database', 'databaseConfig', dbName])
  const uid = config.indexes.byName.uid
  const deps = await dao.get(['database', 'indexDependencies', dbName, uid])
  t.ok(deps.some(d => d.type === 'table' && d.name === 'users'), 'dependency recorded')

  await dao.request(['database', 'createTable'], dbName, 'users')
  await dao.request(['database', 'put'], dbName, 'users', { id: '1', name: 'ada' })
  await delay(500)

  const readyState = await dao.get(['database', 'indexState', dbName, 'byName'])
  t.equal(readyState?.status, 'ready', 'index woke to ready')

  const results = await dao.get(['database', 'indexRange', dbName, 'byName', {}])
  t.deepEqual(results, [{ id: 'ada_1', to: '1' }], 'index data materialised')

  await dao.request(['database', 'put'], dbName, 'users', { id: '2', name: 'bob' })
  await delay(300)
  const results2 = await dao.get(['database', 'indexRange', dbName, 'byName', {}])
  t.deepEqual(results2.sort((a, b) => a.id > b.id ? 1 : -1), [
    { id: 'ada_1', to: '1' },
    { id: 'bob_2', to: '2' }
  ], 'index updates after wake')

  await dao.request(['database', 'deleteIndex'], dbName, 'byName')
  await delay(100)

  const indexesAfter = await dao.get(['database', 'indexesList', dbName])
  t.notOk(indexesAfter.includes('byName'), 'index removed from config')

  const stateAfter = await dao.get(['database', 'indexState', dbName, uid])
  t.notOk(stateAfter, 'indexState row removed')

  const depsAfter = await dao.get(['database', 'indexDependencies', dbName, uid])
  t.equal(depsAfter.length, 0, 'dependencies removed')

  await server.close()
  rimrafSync(dbRoot)
})

test('index with existing table still starts', async t => {
  t.plan(2)
  const dbRoot = 'test-index-sleep-ready.db'
  const dbName = 'index-sleep-ready.test'
  const server = await createTestServer(dbRoot)
  const dao = server.createDao('index-sleep-ready')

  await dao.request(['database', 'createDatabase'], dbName)
  await dao.request(['database', 'createTable'], dbName, 'items')
  await dao.request(['database', 'put'], dbName, 'items', { id: '1', name: 'x' })
  await dao.request(['database', 'createIndex'], dbName, 'itemsByName', `(${
    async function(input, output) {
      const mapper = (obj) => ({ id: obj.name + '_' + obj.id, to: obj.id })
      await input.table('items').onChange((obj, oldObj) =>
        output.change(obj && mapper(obj), oldObj && mapper(oldObj)))
    }
  })`)
  await delay(300)

  const state = await dao.get(['database', 'indexState', dbName, 'itemsByName'])
  t.equal(state?.status, 'ready', 'starts ready when deps exist')
  const results = await dao.get(['database', 'indexRange', dbName, 'itemsByName', {}])
  t.deepEqual(results, [{ id: 'x_1', to: '1' }], 'index has data')

  await server.close()
  rimrafSync(dbRoot)
})
