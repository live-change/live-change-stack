const test = require('tape')

require('fake-indexeddb/auto.js')
const idb = require('idb')
const Store = require('../lib/Store.js')

test("store object observable", t => {
  t.plan(3)

  let store

  t.test("create store", async t => {
    t.plan(1)
    store = new Store('test-object-observable', 'test')
    await store.open()
    t.pass('store created')
  })

  let nextValueResolve
  let gotNextValue
  const getNextValue = () => {
    if(gotNextValue) {
      gotNextValue = false
      return objectObservable.value
    }
    return new Promise((resolve, reject) => nextValueResolve = resolve)
  }

  let objectObservable
  const objectObserver = (signal, value, ...rest) => {
    console.log("SIGNAL", signal, value, ...rest)
    gotNextValue = true
    if(nextValueResolve) nextValueResolve(value)
  }

  t.test('observe object A', t => {
    t.plan(3)
    objectObservable = store.objectObservable('A')
    objectObservable.observe(objectObserver)

    t.test('get value', async t => {
      t.plan(1)
      let value = await getNextValue()
      t.deepEqual(value, null, 'found null')
    })

    t.test("add object A", async t => {
      t.plan(1)
      await store.put({ id: 'A', a: 1 })
      let value = await getNextValue()
      t.deepEqual(value, { id: 'A', a: 1 } , 'found object' )
    })

    t.test("delete object A", async t => {
      t.plan(1)
      await store.delete('A')
      let value = await getNextValue()
      t.deepEqual(value, null , 'found null' )
    })
  })

  t.test("close database", async t => {
    await store.close()
    t.pass('closed')
    t.end()
  })

})
