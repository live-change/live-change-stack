import test from 'tape'
import { rimrafSync } from 'rimraf'
import fs from 'fs'
import Server from '../lib/Server.js'
import { resolveOpLogRetentionMs, DEFAULT_OP_LOG_RETENTION_MS } from '../lib/opLogRetention.js'
import OpLogCleaner from '../lib/OpLogCleaner.js'

test("resolveOpLogRetentionMs", t => {
  t.plan(5)
  t.equal(resolveOpLogRetentionMs({}), DEFAULT_OP_LOG_RETENTION_MS, 'default 2h')
  t.equal(resolveOpLogRetentionMs({ storage: {} }), DEFAULT_OP_LOG_RETENTION_MS, 'empty storage default')
  t.equal(resolveOpLogRetentionMs({ storage: { opLogRetentionMs: false } }), false, 'false disables')
  t.equal(resolveOpLogRetentionMs({ storage: { opLogRetentionMs: 0 } }), false, '0 disables')
  t.equal(resolveOpLogRetentionMs({ storage: { opLogRetentionMs: 3600000 } }), 3600000, 'custom ms')
})

test("oplog retention clear respects cutoff", async t => {
  t.plan(5)

  const dbRoot = 'test-oplog-retention.db'
  rimrafSync(dbRoot)
  await fs.promises.mkdir(dbRoot)

  const server = new Server({
    backend: process.env.DB_BACKEND || 'lmdb',
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  const dao = server.createDao('oplog-retention')
  const dbName = 'oplog.retention.test'

  await dao.request(['database', 'createDatabase'], dbName)
  await dao.request(['database', 'createTable'], dbName, 'users')
  await dao.request(['database', 'put'], dbName, 'users', { id: '1', name: 'david' })
  await dao.request(['database', 'put'], dbName, 'users', { id: '2', name: 'thomas' })

  const db = server.databases.get(dbName)
  const table = db.table('users')
  await table.opLog.put({
    id: '0000000000001000:000000',
    timestamp: 1000,
    operation: { type: 'put', object: { id: 'old', name: 'ancient' } }
  })

  const before = await table.opLog.objectGet('0000000000001000:000000')
  t.ok(before, 'old opLog entry exists')

  const cutoff = Date.now() - 60 * 60 * 1000
  await dao.request(['database', 'clearDatabaseOpLogs'], dbName, cutoff, 100)

  const afterOld = await table.opLog.objectGet('0000000000001000:000000')
  t.equal(afterOld, null, 'old opLog entry removed')

  const recent = await table.opLog.rangeGet({ reverse: true, limit: 5 })
  t.ok(recent.length >= 1, 'recent opLog entries remain')
  t.ok(recent.every(e => e.id > '0000000000001000:000000'), 'remaining ids are newer than old entry')

  const storage = await dao.request(['database', 'updateDatabaseStorage'], dbName, {
    opLogRetentionMs: false
  })
  t.equal(storage.opLogRetentionMs, false, 'updateDatabaseStorage disables retention')

  await server.close()
  await new Promise(resolve => setTimeout(resolve, 50))
  rimrafSync(dbRoot)
})

test("OpLogCleaner tick removes old entries", async t => {
  t.plan(2)

  const dbRoot = 'test-oplog-cleaner.db'
  rimrafSync(dbRoot)
  await fs.promises.mkdir(dbRoot)

  const server = new Server({
    backend: process.env.DB_BACKEND || 'lmdb',
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  const dao = server.createDao('oplog-cleaner')
  const dbName = 'oplog.cleaner.test'

  await dao.request(['database', 'createDatabase'], dbName, {
    storage: { opLogRetentionMs: 60 * 60 * 1000 }
  })
  await dao.request(['database', 'createTable'], dbName, 'items')
  await dao.request(['database', 'put'], dbName, 'items', { id: 'a', v: 1 })

  const table = server.databases.get(dbName).table('items')
  await table.opLog.put({
    id: '0000000000002000:000000',
    timestamp: 2000,
    operation: { type: 'put', object: { id: 'old' } }
  })

  const cleaner = new OpLogCleaner(server, {
    defaultRetentionMs: 60 * 60 * 1000,
    batchSize: 40,
    maxBatchesPerDb: 10,
    disabled: false
  })
  await cleaner.cleanDatabase(dbName)

  t.equal(await table.opLog.objectGet('0000000000002000:000000'), null, 'cleaner removed old entry')
  const remaining = await table.opLog.rangeGet({ reverse: true, limit: 10 })
  t.ok(remaining.length >= 1, 'fresh entries kept')

  await server.close()
  await new Promise(resolve => setTimeout(resolve, 50))
  rimrafSync(dbRoot)
})

test("runOpLogCleaner DAO starts and updates status", async t => {
  t.plan(4)

  const dbRoot = 'test-oplog-cleaner-run.db'
  rimrafSync(dbRoot)
  await fs.promises.mkdir(dbRoot)

  const server = new Server({
    backend: process.env.DB_BACKEND || 'lmdb',
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  const dao = server.createDao('oplog-cleaner-run')
  const dbName = 'oplog.cleaner.run'

  await dao.request(['database', 'createDatabase'], dbName, {
    storage: { opLogRetentionMs: 60 * 60 * 1000 }
  })
  await dao.request(['database', 'createTable'], dbName, 'items')
  await dao.request(['database', 'put'], dbName, 'items', { id: 'a', v: 1 })

  const table = server.databases.get(dbName).table('items')
  await table.opLog.put({
    id: '0000000000002000:000000',
    timestamp: 2000,
    operation: { type: 'put', object: { id: 'old' } }
  })

  const started = await dao.request(['database', 'runOpLogCleaner'], dbName, {})
  t.equal(started.started, true, 'run started')
  t.ok(started.status, 'status returned')

  for(let i = 0; i < 100; i++) {
    const status = await dao.get(['database', 'opLogCleanerStatus'])
    if(!status.running && status.message === 'manual done') break
    await new Promise(resolve => setTimeout(resolve, 20))
  }

  const status = await dao.get(['database', 'opLogCleanerStatus'])
  t.equal(status.running, false, 'cleaner finished')
  t.equal(await table.opLog.objectGet('0000000000002000:000000'), null, 'manual clean removed old entry')

  await server.close()
  await new Promise(resolve => setTimeout(resolve, 50))
  rimrafSync(dbRoot)
})

test("startup cleaner writes one clearOpLog marker per store", async t => {
  t.plan(3)

  const dbRoot = 'test-oplog-cleaner-startup.db'
  rimrafSync(dbRoot)
  await fs.promises.mkdir(dbRoot)

  const server = new Server({
    backend: process.env.DB_BACKEND || 'lmdb',
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  const dao = server.createDao('oplog-cleaner-startup')
  const dbName = 'oplog.cleaner.startup'

  await dao.request(['database', 'createDatabase'], dbName, {
    storage: { opLogRetentionMs: 60 * 60 * 1000 }
  })
  await dao.request(['database', 'createTable'], dbName, 'items')
  await dao.request(['database', 'put'], dbName, 'items', { id: 'a', v: 1 })

  const table = server.databases.get(dbName).table('items')
  for(let i = 0; i < 5; i++) {
    const ts = 1000 + i
    const id = ('' + ts).padStart(16, '0') + ':000000'
    await table.opLog.put({
      id,
      timestamp: ts,
      operation: { type: 'put', object: { id: 'old' + i } }
    })
  }

  const cleaner = new OpLogCleaner(server, {
    defaultRetentionMs: 60 * 60 * 1000,
    batchSize: 2,
    maxBatchesPerDb: 100,
    disabled: false
  })
  await cleaner.cleanDatabase(dbName, { mode: 'startup', batchSize: 2, maxBatches: 100 })

  t.equal(await table.opLog.objectGet('0000000000001000:000000'), null, 'old entry removed')
  t.equal(await table.opLog.objectGet('0000000000001004:000000'), null, 'last old entry removed')

  const remaining = await table.opLog.rangeGet({})
  const clearMarkers = remaining.filter(e => e.operation?.type === 'clearOpLog')
  t.equal(clearMarkers.length, 1, 'single clearOpLog marker after draining store')

  await server.close()
  await new Promise(resolve => setTimeout(resolve, 50))
  rimrafSync(dbRoot)
})
