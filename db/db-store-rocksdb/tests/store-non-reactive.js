import test from 'tape'
import Store from '../lib/Store.js'
import { openTestDown, closeTestDown } from './utils.js'
import PQueue from 'p-queue'

const testQueue = new PQueue({ concurrency: 1 })
function queued(fn) {
  return async t => {
    return await testQueue.add(() => fn(t))
  }
}

const dbPath = `./test.nr.db`

test("store non-reactive properties", t => {
  t.plan(3)

  let down
  let store

  t.test("create store", async t => {
    t.plan(1)
    down = await openTestDown(dbPath)
    store = new Store(down, { prefix: 't\x00' })
    t.pass('store created')
  })

  t.test("non reactive operations", async t => {
    t.plan(20)

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

    t.test("count range [a,c]", queued(async t => {
      t.plan(1)
      let values = await store.countGet({ gte: 'a', lte: 'c' })
      t.deepEqual(values, 3, 'range count' )
    }))

    t.test("get reverse range [c,a]", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lte: 'c', reverse: true })
      t.deepEqual(values, [ { v: 3, id: 'c' }, { v: 2, id: 'b' },  { v: 1, id: 'a' } ], 'range read' )
    }))

    t.test("count reverse range [a,c]", queued(async t => {
      t.plan(1)
      let values = await store.countGet({ gte: 'a', lte: 'c', reverse: true })
      t.deepEqual(values, 3, 'range count' )
    }))

    t.test("get range [a,c] with limit 2", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lte: 'c', limit: 2 })
      t.deepEqual(values, [ { v: 1, id: 'a' }, { v: 2, id: 'b' } ], 'range read' )
    }))

    t.test("count range [a,c] with limit 2", queued(async t => {
      t.plan(1)
      let values = await store.countGet({ gte: 'a', lte: 'c', limit: 2 })
      t.deepEqual(values, 2, 'range read' )
    }))

    t.test("get reverse range [c,a] with limit 2", queued(async t => {
      t.plan(1)
      let values = await store.rangeGet({ gte: 'a', lte: 'c', reverse: true, limit: 2 })
      t.deepEqual(values, [ { v: 3, id: 'c' }, { v: 2, id: 'b' } ], 'range read' )
    }))

    t.test("get reverse count [c,a] with limit 2", queued(async t => {
      t.plan(1)
      let values = await store.countGet({ gte: 'a', lte: 'c', reverse: true, limit: 2 })
      t.deepEqual(values, 2, 'range read' )
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

    t.test("rangeDelete keysOnly", queued(async t => {
      t.plan(3)
      await store.put({ id: 'd', v: 4 })
      await store.put({ id: 'e', v: 5 })
      const result = await store.rangeDelete({ gte: 'd', lt: 'f' }, { keysOnly: true })
      t.equal(result.count, 2, 'deleted 2 keys without reading values')
      t.equal(await store.objectGet('d'), null, 'd gone')
      t.equal(await store.objectGet('e'), null, 'e gone')
    }))
  })

  t.test("close and remove database", queued(async t => {
    t.plan(1)
    await closeTestDown(down, dbPath)
    t.pass('removed')
  }))
})
