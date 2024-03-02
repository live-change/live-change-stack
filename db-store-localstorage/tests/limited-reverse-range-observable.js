const test = require('tape')

require('fake-indexeddb/auto.js')
const idb = require('idb')
const Store = require('../lib/Store.js')

test("store limited reverse range observable", t => {
  t.plan(5)

  let store

  t.test("create store", async t => {
    t.plan(1)
    store = new Store('test-limited-reverse-range-observable', 'test', 'local')
    await store.open()
    t.pass('store created')
  })

  let objects = []

  t.test("put objects", async t => {
    t.plan(1)
    await store.put({ id: 'a_0', v: 1  })
    for(let i = 0; i < 10; i++) {
      let obj = { id: 'b_' + i, v: i  }
      objects.unshift(obj)
      await store.put(obj)
    }
    await store.put({ id: 'c_0', v: 1  })
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

  t.test("observe reverse range [b_9,b_0]", t => {
    t.plan(7)
    rangeObservable = store.rangeObservable({ gte: 'b_0', lte: 'b_9', limit: 5, reverse: true })
    rangeObservable.observe(rangeObserver)

    let values

    t.test("get values", async t => {
      t.plan(1)
      values = await getNextValue()
      t.deepEqual(values, objects.slice(0,5), 'range value')
    })

    t.test("remove object 'b_6' from observed range", async t => {
      t.plan(1)
      await store.delete('b_6')
      objects.splice(3, 1)
      await getNextValue() // one shorter
      let values = await getNextValue()
      t.deepEqual(values, objects.slice(0, 5), 'range value' )
    })

    t.test("add object 'b_6' to observed range", async t => {
      t.plan(1)
      const obj = { id: 'b_6', v: 10 }
      await store.put(obj)
      objects.splice(3, 0, obj)
      let values = await getNextValue()
      t.deepEqual(values, objects.slice(0, 5), 'range value' )
    })

    t.test("add object 'b_58' to observed range", async t => {
      t.plan(1)
      const obj = { id: 'b_58', v: 11 }
      await store.put(obj)
      objects.splice(4, 0, obj)
      let values = await getNextValue()
      t.deepEqual(values, objects.slice(0, 5), 'range value' )
    })

    t.test("add object 'b_52' outside observed range limits", async t => {
      t.plan(1)
      const obj = { id: 'b_52', v: 11 }
      await store.put(obj)
      objects.splice(5, 0, obj)
      t.pass('added')
    })

    t.test("delete object 'b_58' so b_52 will enter into range limits", async t => {
      t.plan(1)
      await store.delete('b_58')
      objects.splice(4, 1)
      await getNextValue()
      let values = await getNextValue()
      t.deepEqual(values, objects.slice(0, 5), 'range value' )
    })

    t.test("unobserve range", async t => {
      t.plan(1)
      rangeObservable.unobserve(rangeObserver)
      t.pass('unobserved')
    })
  })

  t.test("observe reverse range (b_5,b_0)", t => {
    t.plan(7)
    gotNextValue = false
    rangeObservable = store.rangeObservable({ gt: 'b_0', lt: 'b_5', limit: 3, reverse: true })
    rangeObservable.observe(rangeObserver)

    let values
    t.test("get values", async t => {
      t.plan(1)
      values = await getNextValue()
      t.deepEqual(values, objects.slice(6,9), 'range value')
    })

    t.test("remove object 'b_5' outside observed range", async t => {
      t.plan(1)
      await store.delete('b_5')
      t.pass('deleted')
    })

    t.test("remove object 'b_0' outside observed range", async t => {
      t.plan(1)
      await store.delete('b_0')
      t.pass('deleted')
    })

    t.test("remove object 'b_1' outside observed range limits", async t => {
      t.plan(1)
      await store.delete('b_1')
      t.pass('deleted')
    })

    t.test("add object 'b_48' to observed range", async t => {
      t.plan(1)
      const obj = { id: 'b_48', v: 7 }
      await store.put(obj)
      objects.splice(6, 0, obj)
      let values = await getNextValue()
      t.deepEqual(values, objects.slice(6,9), 'range value' )
    })

    t.test("remove object 'b_48' from observed range", async t => {
      t.plan(1)
      await store.delete('b_48')
      objects.splice(6, 1)
      await getNextValue()
      let values = await getNextValue()
      t.deepEqual(values, objects.slice(6,9) , 'range value' )
    })

    t.test("unobserve range", async t => {
      t.plan(1)
      rangeObservable.unobserve(rangeObserver)
      t.pass('unobserved')
    })
  })

  t.test("close database", async t => {
    await store.close()
    t.pass('closed')
    t.end()
  })

})
