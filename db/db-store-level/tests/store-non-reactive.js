import test from 'tape'
import levelup from 'levelup'
import leveldown from 'leveldown'
import encoding from 'encoding-down'
import { rimraf } from 'rimraf'

import Store from '../lib/Store.js'

import PQueue from 'p-queue'
const testQueue = new PQueue({ concurrency: 1 })
function queued(fn) {
  return async t => {
    return await testQueue.add(() => fn(t))
  }
}

const dbPath = `./test.nr.db`
rimraf.sync(dbPath)
const level = levelup(encoding(leveldown(dbPath), { keyEncoding: 'ascii', valueEncoding: 'json' }))

test("store non-reactive properties", t => {
  t.plan(3)

  let store

  t.test("create store", async t => {
    t.plan(1)
    store = new Store(level)
    t.pass('store created')
  })

  t.test("non reactive operations", async t => {
    t.plan(15)

    t.test("put value", queued(async t => {
      t.plan(1)
      await store.put({ id:'a', v: 1 })
      t.pass('value written')
    }))

    t.test("get value", queued(async t => {
      t.plan(1)
      const v = await store.objectGet('a')
      t.deepEqual(v, { v: 1, id: 'a' }, 'value read')
    }))

    t.test("put another values", queued(async t => {
      t.plan(1)
      await store.put({ id: 'c', v: 3 })
      await store.put({ id: 'b', v: 2 })
      t.pass('values written')
    }))

    t.test("get range [a,c]", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lte: 'c' })
      t.deepEqual(values, [ { v: 1, id: 'a' }, { v: 2, id: 'b' }, { v: 3, id: 'c' } ], 'range read' )
    }))

    t.test("get reverse range [c,a]", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lte: 'c', reverse: true })
      t.deepEqual(values, [ { v: 3, id: 'c' }, { v: 2, id: 'b' },  { v: 1, id: 'a' } ], 'range read' )
    }))

    t.test("get range [a,c] with limit 2", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lte: 'c', limit: 2 })
      t.deepEqual(values, [ { v: 1, id: 'a' }, { v: 2, id: 'b' } ], 'range read' )
    }))

    t.test("get reverse range [c,a] with limit 2", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lte: 'c', reverse: true, limit: 2 })
      t.deepEqual(values, [ { v: 3, id: 'c' }, { v: 2, id: 'b' } ], 'range read' )
    }))

    t.test("get range (a,c]", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gt: 'a', lte: 'c' })
      t.deepEqual(values, [ { v: 2, id: 'b' }, { v: 3, id: 'c' } ], 'range read' )
    }))

    t.test("get reverse range [c,a)", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gt: 'a', lte: 'c', reverse: true })
      t.deepEqual(values, [ { v: 3, id: 'c' }, { v: 2, id: 'b' }, ], 'range read' )
    }))

    t.test("get range [a,c)", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lt: 'c' })
      t.deepEqual(values, [ { v: 1, id: 'a' }, { v: 2, id: 'b' } ], 'range read' )
    }))

    t.test("get reverse range (c,a]", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lt: 'c', reverse: true })
      t.deepEqual(values, [ { v: 2, id: 'b' }, { v: 1, id: 'a' } ], 'range read' )
    }))

    t.test("get range (a,c)", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gt: 'a', lt: 'c' })
      t.deepEqual(values, [ { v: 2, id: 'b' } ], 'range read' )
    }))

    t.test("get reverse range (a,c)", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gt: 'a', lt: 'c', reverse: true })
      t.deepEqual(values, [ { v: 2, id: 'b' } ], 'range read' )
    }))

    t.test("remove 'b'", queued(async t => {
      t.plan(1)
      await store.delete('b')
      t.pass("removed")
    }))

    t.test("get range [a,c]", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lte: 'c' })
      t.deepEqual(values, [ { v: 1, id: 'a' }, { v: 3, id: 'c' } ], 'range read' )
    }))
  })

  t.test("close and remove database", async t => {
    t.plan(1)
    await level.close()
    await rimraf(dbPath)
    t.pass('removed')
  })
})
