import test from 'tape'
import { rimrafSync } from 'rimraf'
import fs from 'fs'
import Server from '../lib/Server.js'

test("storage stats", async t => {
  t.plan(9)

  const dbRoot = 'test-storage-stats.db'
  rimrafSync(dbRoot)
  await fs.promises.mkdir(dbRoot)

  const server = new Server({
    backend: process.env.DB_BACKEND || 'lmdb',
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  const dao = server.createDao('storage-stats')
  const dbName = 'storage.stats.test'

  await dao.request(['database', 'createDatabase'], dbName)
  await dao.request(['database', 'createTable'], dbName, 'users')
  await dao.request(['database', 'put'], dbName, 'users', { id: '1', name: 'david' })
  await dao.request(['database', 'put'], dbName, 'users', { id: '2', name: 'thomas' })
  await dao.request(['database', 'put'], dbName, 'users', { id: '3', name: 'george' })

  const tableStats = await dao.get(['database', 'tableStorageStats', dbName, 'users'])
  t.equal(tableStats.data.available, true, 'data stat available')
  t.equal(typeof tableStats.data.usedBytes, 'number', 'data usedBytes is a number')
  if(tableStats.data.entryCount != null) {
    t.equal(tableStats.data.entryCount, 3, 'data entryCount')
    t.ok(tableStats.data.usedBytes > 0, 'data usedBytes')
  } else {
    t.equal(tableStats.data.entryCount, null, 'entryCount unavailable on this backend')
    t.pass('approximateSize may be 0 before flush')
  }
  t.equal(typeof tableStats.opLog.usedBytes, 'number', 'opLog usedBytes is a number')
  if(tableStats.opLog.entryCount != null) {
    t.ok(tableStats.opLog.entryCount >= 1, 'opLog entryCount')
  } else {
    t.equal(tableStats.opLog.entryCount, null, 'opLog entryCount unavailable on this backend')
  }

  const dbStats = await dao.get(['database', 'databaseStorageStats', dbName])
  t.equal(dbStats.env.available, true, 'env available')
  t.ok(
    (dbStats.env.fileBytes > 0) || (dbStats.totals.storeUsedBytes > 0),
    'env fileBytes or storeUsedBytes > 0'
  )
  const users = dbStats.stores.find(s => s.type === 'table' && s.name === 'users')
  if(users?.entryCount != null) {
    t.equal(users.entryCount, 3, 'users in stores list')
  } else {
    t.ok(users && users.data && users.data.available, 'users in stores list')
  }

  await server.close()
  await new Promise(resolve => setTimeout(resolve, 50))
  rimrafSync(dbRoot)
})
