import test from 'tape'
import { rimrafSync } from 'rimraf'
import fs from 'fs'
import Server from '../lib/Server.js'

const backendName = process.env.DB_BACKEND || 'lmdb'
const supportsCompact = backendName === 'rocksdb' || backendName === 'leveldb'

test("compact database", async t => {
  t.plan(6)

  const dbRoot = 'test-compact.db'
  rimrafSync(dbRoot)
  await fs.promises.mkdir(dbRoot)

  const server = new Server({
    backend: backendName,
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  const dao = server.createDao('compact')
  const dbName = 'compact.test'

  await dao.request(['database', 'createDatabase'], dbName)
  await dao.request(['database', 'createTable'], dbName, 'users')
  await dao.request(['database', 'put'], dbName, 'users', { id: '1', name: 'david' })

  const compact = await dao.request(['database', 'compactDatabase'], dbName)
  t.equal(compact.supported, supportsCompact, 'compactDatabase supported matches backend')
  const row = await dao.get(['database', 'tableObject', dbName, 'users', '1'])
  t.equal(row && row.name, 'david', 'row survives compactDatabase')

  const ranged = await dao.request(['database', 'compactDatabaseRange'], dbName, '0', '\uffff')
  t.equal(ranged.supported, supportsCompact, 'compactDatabaseRange supported matches backend')
  const rowAfter = await dao.get(['database', 'tableObject', dbName, 'users', '1'])
  t.equal(rowAfter && rowAfter.name, 'david', 'row survives compactDatabaseRange')

  try {
    await dao.request(['database', 'compactDatabase'], 'missing-db')
    t.fail('missing database should throw')
  } catch(err) {
    t.equal(err && (err.message || err), 'databaseNotFound', 'missing database')
  }

  try {
    await dao.request(['database', 'compactDatabaseRange'], dbName, null, 'z')
    t.fail('missing range should throw')
  } catch(err) {
    t.equal(err && (err.message || err), 'rangeRequired', 'range required')
  }

  await server.close()
  await new Promise(resolve => setTimeout(resolve, 50))
  rimrafSync(dbRoot)
})
