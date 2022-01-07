const test = require('tape')

require('fake-indexeddb/auto.js')
const idb = require('idb')
const Store = require('../lib/Store.js')

test("store broadcast object changes", t => {
  t.plan(3)

  let writeStore
  let readStore

  t.test("create stores", async t => {
    t.plan(2)
    readStore = new Store('test-broadcast-object-changes')
    await readStore.open()
    t.pass('read store created')
    writeStore = new Store('test-broadcast-object-changes')
    await writeStore.open()
    t.pass('write store created')
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
    if(nextValueResolve) {
      nextValueResolve(value)
    } else {
      gotNextValue = true
    }
  }

  t.test('observe object A', async t => {
    t.plan(3)
    objectObservable = readStore.objectObservable('A')
    objectObservable.observe(objectObserver)
    let value = await getNextValue()
    t.deepEqual(value, null, 'found null')

    t.test("add object A", async t => {
      t.plan(1)
      await writeStore.put({ id: 'A', a: 1 })
      let value = await getNextValue()
      t.deepEqual(value, { id: 'A', a: 1 } , 'found object' )
    })

    t.test("delete object A", async t => {
      t.plan(1)
      await writeStore.delete('A')
      let value = await getNextValue()
      t.deepEqual(value, null , 'found null' )
    })
  })

  t.test("close database", async t => {
    t.plan(2)
    await readStore.close()
    t.pass('read store closed')
    await writeStore.close()
    t.pass('write store closed')
    t.end()
  })

})