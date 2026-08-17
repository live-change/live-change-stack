import test from 'tape'
import lmdb from 'node-lmdb'
import { rimraf } from 'rimraf'
import fs from 'fs'

import Store from '../lib/Store.js'

const dbPath = `./test.stat.db`
rimraf.sync(dbPath)
fs.mkdirSync(dbPath)
const env = new lmdb.Env()
env.open({
  path: dbPath,
  maxDbs: 10
})
const dbi = env.openDbi({
  name: "test",
  create: true
})

test("store stat", t => {
  t.plan(3)

  let store

  t.test("create store", async t => {
    t.plan(1)
    store = new Store(env, dbi)
    t.pass('store created')
  })

  t.test("stat after puts", async t => {
    t.plan(4)
    await store.put({ id: 'a', v: 1 })
    await store.put({ id: 'b', v: 2 })
    await store.put({ id: 'c', v: 3 })
    const s = store.stat()
    t.equal(s.available, true, 'available')
    t.equal(s.entryCount, 3, 'entryCount after 3 puts')
    t.ok(s.usedBytes > 0, 'usedBytes > 0')
    t.ok(s.pageSize > 0, 'pageSize > 0')
  })

  t.test("stat after delete", async t => {
    t.plan(2)
    await store.delete('b')
    const s = store.stat()
    t.equal(s.entryCount, 2, 'entryCount after delete')
    t.ok(s.usedBytes > 0, 'usedBytes still > 0')
  })
})

test.onFinish(() => {
  dbi.close()
  env.close()
  rimraf.sync(dbPath)
})
