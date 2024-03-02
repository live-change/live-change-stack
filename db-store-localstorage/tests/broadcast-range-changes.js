const test = require('tape')

require('fake-indexeddb/auto.js')
const idb = require('idb')
const Store = require('../lib/Store.js')

const nextTick = () => new Promise(resolve => {
  console.log("WAIT!")
  setTimeout(resolve, 100)
})

test("store broadcast range changes", t => {
  t.plan(5)

  let writeStore
  let readStore

  t.test("create stores", async t => {
    t.plan(2)
    readStore = new Store('test-broadcast-object-changes', 'test', 'local')
    await readStore.open()
    t.pass('read store created')
    writeStore = new Store('test-broadcast-object-changes', 'test', 'local')
    await writeStore.open()
    t.pass('write store created')
  })

  t.test("put objects", async t => {
    t.plan(1)
    await writeStore.put({ v: 1, id: 'a' })
    await writeStore.put({ v: 3, id: 'c' })
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
    if(nextValueResolve) {
      nextValueResolve(rangeObservable.list)
    } else {
      gotNextValue = true
    }
  }

  t.test("observe range [a,z]", t => {
    t.plan(6)


    let values

    t.test("get values", async t => {
      t.plan(1)
      await nextTick()
      rangeObservable = readStore.rangeObservable({ gte: 'a', lte: 'z' })
      rangeObservable.observe(rangeObserver)
      values = await getNextValue()
      t.deepEqual(values, [{v: 1, id: 'a'}, {v: 3, id: 'c'}], 'range value')
    })

    t.test("remove object 'a' from observed range", async t => {
      t.plan(1)
      await nextTick()
      await writeStore.delete('a')
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 3, id: 'c' } ], 'range value' )
    })

    t.test("add object 'a' to observed range", async t => {
      t.plan(1)
      await nextTick()
      await writeStore.put({ id: 'a', v: 4 })
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 4, id: 'a' }, { v: 3, id: 'c' } ], 'range value' )
    })

    t.test("add object 'b' to observed range", async t => {
      t.plan(1)
      await nextTick()
      await writeStore.put({ id: 'b', v: 5 })
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 4, id: 'a' }, { v: 5, id: 'b' }, { v: 3, id: 'c' } ], 'range value' )
    })

    t.test("add object 'd' to observed range", async t => {
      t.plan(1)
      await nextTick()
      await writeStore.put({ id: 'd', v: 6 })
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 4, id: 'a' }, { v: 5, id: 'b' }, { v: 3, id: 'c' }, { v: 6, id: 'd' } ], 'range value' )
    })

    t.test("unobserve range", async t => {
      t.plan(1)
      await nextTick()
      rangeObservable.unobserve(rangeObserver)
      t.pass('unobserved')
    })
  })

  t.test("observe range (a,d)", t => {
    t.plan(6)

    let values

    t.test("get values", async t => {
      t.plan(1)
      await nextTick()
      rangeObservable = readStore.rangeObservable({ gt: 'a', lt: 'd' })
      rangeObservable.observe(rangeObserver)
      values = await getNextValue()
      t.deepEqual(values, [{v: 5, id: 'b'}, {v: 3, id: 'c'}], 'range value')
    })

    t.test("remove object 'd' outside observed range", async t => {
      t.plan(1)
      await nextTick()
      await writeStore.delete('d')
      t.pass('deleted')
    })

    t.test("remove object 'a' outside observed range", async t => {
      t.plan(1)
      await nextTick()
      await writeStore.delete('a')
      t.pass('deleted')
    })

    t.test("add object 'ab' to observed range", async t => {
      t.plan(1)
      await nextTick()
      await writeStore.put({ id: 'ab', v: 7 })
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 7, id: 'ab' }, { v: 5, id: 'b' }, { v: 3, id: 'c' } ], 'range value' )
    })

    t.test("remove object 'ab' from observed range", async t => {
      t.plan(1)
      await nextTick()
      await writeStore.delete('ab')
      let values = await getNextValue()
      t.deepEqual(values, [ { v: 5, id: 'b' }, { v: 3, id: 'c' } ], 'range value' )
    })

    t.test("unobserve range", async t => {
      t.plan(1)
      await nextTick()
      rangeObservable.unobserve(rangeObserver)
      t.pass('unobserved')
    })
  })

  t.test("close database", async t => {
    await readStore.close()
    await writeStore.close()
    t.pass('closed')
    t.end()
  })

})
