import test from 'tape'
import Store from '../lib/Store.js'
import { openTestDown, closeTestDown } from './utils.js'

const dbPath = `./test.st.db`

test("store stat", t => {
  t.plan(3)

  let down
  let store

  t.test("create store", async t => {
    t.plan(1)
    down = await openTestDown(dbPath)
    store = new Store(down, { prefix: 't\x00' })
    t.pass('store created')
  })

  t.test("approximate size after put", async t => {
    t.plan(2)
    await store.put({ id: 'a', v: 1 })
    const s = await store.stat()
    t.equal(s.available, true, 'stat available')
    t.equal(typeof s.usedBytes, 'number', 'usedBytes is a number')
  })

  t.test("close and remove database", async t => {
    t.plan(1)
    await closeTestDown(down, dbPath)
    t.pass('removed')
  })
})
