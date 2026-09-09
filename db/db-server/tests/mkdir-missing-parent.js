import test from 'tape'
import { rimrafSync } from 'rimraf'
import fs from 'fs'
import path from 'path'
import Server from '../lib/Server.js'

test('creates missing dbRoot and nested database dirs', async t => {
  t.plan(2)

  const parent = 'test-mkdir-missing'
  const dbRoot = path.join(parent, 'root.db')
  rimrafSync(parent)

  const server = new Server({
    backend: process.env.DB_BACKEND || 'lmdb',
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  t.ok(fs.existsSync(dbRoot), 'dbRoot created')

  const dao = server.createDao('mkdir-missing')
  const dbName = 'mkdir.missing.test'
  await dao.request(['database', 'createDatabase'], dbName)
  await dao.request(['database', 'createTable'], dbName, 'users')
  await dao.request(['database', 'put'], dbName, 'users', { id: '1', name: 'ada' })
  const got = await dao.get(['database', 'tableObject', dbName, 'users', '1'])
  t.equal(got?.name, 'ada', 'read after create in missing parent')

  await server.close()
  await new Promise(resolve => setTimeout(resolve, 50))
  rimrafSync(parent)
})
