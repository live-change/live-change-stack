import test from 'tape'
import { rimrafSync } from 'rimraf'
import fs from 'fs'
import Server from '../lib/Server.js'

test("storage stats", async t => {
  t.plan(7)

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
  t.equal(tableStats.data.entryCount, 3, 'data entryCount')
  t.ok(tableStats.data.usedBytes > 0, 'data usedBytes')
  t.ok(tableStats.opLog.entryCount >= 1, 'opLog entryCount')
  t.ok(tableStats.opLog.usedBytes > 0, 'opLog usedBytes')

  const dbStats = await dao.get(['database', 'databaseStorageStats', dbName])
  const backend = process.env.DB_BACKEND || 'lmdb'
  if(backend === 'lmdb') {
    t.equal(dbStats.env.available, true, 'env available for lmdb')
  } else {
    t.pass('env check skipped for non-lmdb backend')
  }
  t.ok(dbStats.totals.storeUsedBytes > 0, 'totals.storeUsedBytes')
  const users = dbStats.stores.find(s => s.type === 'table' && s.name === 'users')
  t.equal(users?.entryCount, 3, 'users in stores list')

  await server.close()
  await new Promise(resolve => setTimeout(resolve, 50))
  rimrafSync(dbRoot)
})
