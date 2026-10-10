import test from 'tape'
import { rimrafSync } from 'rimraf'
import fs from 'fs'
import Server from '../lib/Server.js'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function openTestServer(dbRoot, { fresh = true } = {}) {
  if(fresh) {
    rimrafSync(dbRoot)
    await fs.promises.mkdir(dbRoot)
  }
  const server = new Server({
    backend: process.env.DB_BACKEND || 'lmdb',
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  return server
}

function byNameCode() {
  return `(${
    async function(input, output) {
      const mapper = (obj) => ({ id: obj.name + '_' + obj.id, to: obj.id })
      await input.table('users').onChange((obj, oldObj) =>
        output.change(obj && mapper(obj), oldObj && mapper(oldObj)))
    }
  })`
}

function fromByNameCode() {
  return `(${
    async function(input, output) {
      await input.index('byName').onChange((obj, oldObj) => output.change(obj, oldObj))
    }
  })`
}

test('whenIndexesSettled resolves only after index is READY', async t => {
  t.plan(4)
  const dbRoot = 'test-when-indexes-settled-ready.db'
  const dbName = 'when-indexes-settled-ready.test'
  const server = await openTestServer(dbRoot)
  const dao = server.createDao('when-indexes-settled-ready')

  await dao.request(['database', 'createDatabase'], dbName)
  await dao.request(['database', 'createIndex'], dbName, 'byName', byNameCode())
  await delay(200)
  const sleeping = await dao.get(['database', 'indexState', dbName, 'byName'])
  t.equal(sleeping?.status, 'sleeping', 'index sleeps until table exists')

  const createTableP = dao.request(['database', 'createTable'], dbName, 'users')
  const settledP = dao.request(['database', 'whenIndexesSettled'], dbName)
  await createTableP
  await dao.request(['database', 'put'], dbName, 'users', { id: '1', name: 'ada' })
  await dao.request(['database', 'put'], dbName, 'users', { id: '2', name: 'bob' })
  const settled = await settledP
  t.ok(settled?.ok, 'whenIndexesSettled returned ok')
  await dao.request(['database', 'whenIndexesSettled'], dbName)
  await delay(200)

  const ready = await dao.get(['database', 'indexState', dbName, 'byName'])
  t.equal(ready?.status, 'ready', 'index is ready after settle')
  const results = await dao.get(['database', 'indexRange', dbName, 'byName', {}])
  t.deepEqual(
    results.sort((a, b) => a.id > b.id ? 1 : -1),
    [{ id: 'ada_1', to: '1' }, { id: 'bob_2', to: '2' }],
    'indexRange has all rows after settle'
  )

  await server.close()
  rimrafSync(dbRoot)
})

test('whenIndexesSettled returns immediately when all settled', async t => {
  t.plan(3)
  const dbRoot = 'test-when-indexes-settled-immediate.db'
  const dbName = 'when-indexes-settled-immediate.test'
  const server = await openTestServer(dbRoot)
  const dao = server.createDao('when-indexes-settled-immediate')

  await dao.request(['database', 'createDatabase'], dbName)
  await dao.request(['database', 'createTable'], dbName, 'users')
  await dao.request(['database', 'put'], dbName, 'users', { id: '1', name: 'ada' })
  await dao.request(['database', 'createIndex'], dbName, 'byName', byNameCode())
  await delay(300)
  const ready = await dao.get(['database', 'indexState', dbName, 'byName'])
  t.equal(ready?.status, 'ready', 'index ready before settle call')

  const t0 = Date.now()
  const settled = await dao.request(['database', 'whenIndexesSettled'], dbName)
  t.ok(Date.now() - t0 < 500, 'returns quickly when already settled')
  t.ok(settled?.ok, 'ok')

  await server.close()
  rimrafSync(dbRoot)
})

test('whenIndexesSettled wakes sleeping dependent after restart', async t => {
  t.plan(4)
  const dbRoot = 'test-when-indexes-settled-restart.db'
  const dbName = 'when-indexes-settled-restart.test'
  let server = await openTestServer(dbRoot)
  let dao = server.createDao('when-indexes-settled-restart')

  await dao.request(['database', 'createDatabase'], dbName)
  await dao.request(['database', 'createTable'], dbName, 'users')
  await dao.request(['database', 'put'], dbName, 'users', { id: '1', name: 'ada' })
  await dao.request(['database', 'createIndex'], dbName, 'byName', byNameCode())
  await dao.request(['database', 'createIndex'], dbName, 'fromByName', fromByNameCode())
  await delay(300)
  const before = await dao.get(['database', 'indexState', dbName, 'fromByName'])
  t.equal(before?.status, 'ready', 'dependent ready before restart')
  await server.close()

  server = await openTestServer(dbRoot, { fresh: false })
  dao = server.createDao('when-indexes-settled-restart-2')
  const settled = await dao.request(['database', 'whenIndexesSettled'], dbName)
  t.ok(settled?.ok, 'settle after restart ok')
  const after = await dao.get(['database', 'indexState', dbName, 'fromByName'])
  t.equal(after?.status, 'ready', 'dependent ready after settle')
  const results = await dao.get(['database', 'indexRange', dbName, 'fromByName', {}])
  t.deepEqual(results, [{ id: 'ada_1', to: '1' }], 'dependent has source rows')

  await server.close()
  rimrafSync(dbRoot)
})
