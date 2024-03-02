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

const dbPath = `./test.ro.db`
rimraf.sync(dbPath)
const level = levelup(encoding(leveldown(dbPath), { keyEncoding: 'ascii', valueEncoding: 'json' }))

test("store range observable", t => {
  t.plan(5)

  let store

  t.test("create store", async t => {
    t.plan(1)
    store = new Store(level)
    t.pass('store created')
  })

  t.test("put objects", async t => {
    t.plan(1)
    await store.put({ v: 1, id: 'a' })
    await store.put({ v: 3, id: 'c' })
    t.pass('objects written')
  })

  let nextValueResolve
  let gotNextValue
  const getNextValue = () => {
    if(gotNextValue) {
      gotNextValue = false
      return rangeObservable.list
    }
    return new Promise((resolve, reject) => nextValueResolve = resolve)
  }
  let rangeObservable
  const rangeObserver = (signal, value, ...rest) => {
    console.log("SIGNAL", signal, value, ...rest)
    gotNextValue = true
    if(nextValueResolve) nextValueResolve(rangeObservable.list)
  }

  t.test("observe range [a,z]", async t => {
    t.plan(6)
    rangeObservable = store.rangeObservable({ gte: 'a', lte: 'z' })
    rangeObservable.observe(rangeObserver)
    let values = await getNextValue()
    t.deepEqual(values, [ { v: 1, id: 'a' }, { v: 3, id: 'c' } ], 'range value' )

    t.test("remove object 'a' from observed range", queued(async t => {
      t.plan(1)
      await store.delete('a')
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 3, id: 'c' } ], 'range value' )
    }))

    t.test("add object 'a' to observed range", queued(async t => {
      t.plan(1)
      await store.put({ id: 'a', v: 4 })
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 4, id: 'a' }, { v: 3, id: 'c' } ], 'range value' )
    }))

    t.test("add object 'b' to observed range", queued(async t => {
      t.plan(1)
      await store.put({ id: 'b', v: 5 })
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 4, id: 'a' }, { v: 5, id: 'b' }, { v: 3, id: 'c' } ], 'range value' )
    }))

    t.test("add object 'd' to observed range", queued(async t => {
      t.plan(1)
      await store.put({ id: 'd', v: 6 })
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 4, id: 'a' }, { v: 5, id: 'b' }, { v: 3, id: 'c' }, { v: 6, id: 'd' } ], 'range value' )
    }))

    t.test("unobserve range", queued(async t => {
      t.plan(1)
      rangeObservable.unobserve(rangeObserver)
      t.pass('unobserved')
    }))

  })

  t.test("observe range (a,d)", async t => {
    t.plan(6)
    rangeObservable = store.rangeObservable({ gt: 'a', lt: 'd' })
    rangeObservable.observe(rangeObserver)
    let values = await getNextValue()
    t.deepEqual(values, [ { v: 5, id: 'b' }, { v: 3, id: 'c' } ], 'range value' )

    t.test("remove object 'd' outside observed range", queued(async t => {
      t.plan(1)
      await store.delete('d')
      t.pass('deleted')
    }))

    t.test("remove object 'a' outside observed range", queued(async t => {
      t.plan(1)
      await store.delete('a')
      t.pass('deleted')
    }))

    t.test("add object 'ab' to observed range", queued(async t => {
      t.plan(1)
      await store.put({ id: 'ab', v: 7 })
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 7, id: 'ab' }, { v: 5, id: 'b' }, { v: 3, id: 'c' } ], 'range value' )
    }))

    t.test("remove object 'ab' from observed range", queued(async t => {
      t.plan(1)
      await store.delete('ab')
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 5, id: 'b' }, { v: 3, id: 'c' } ], 'range value' )
    }))

    t.test("unobserve range", queued(async t => {
      t.plan(1)
      rangeObservable.unobserve(rangeObserver)
      t.pass('unobserved')
    }))

  })

  t.test("close and remove database", async t => {
    t.plan(1)
    await level.close()
    await rimraf(dbPath)
    t.pass('removed')
  })
})
