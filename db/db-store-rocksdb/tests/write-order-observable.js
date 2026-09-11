import test from 'tape'
import Store from '../lib/Store.js'
import { openTestDown, closeTestDown } from './utils.js'

const dbPath = `./test.wo.db`

function padTimestamp(ts) {
  return ('' + ts).padStart(16, '0')
}

function createOpLogWritter(store) {
  let lastTime = Date.now()
  let lastId = 0
  return function(operation) {
    const now = Date.now()
    if(now === lastTime) {
      lastId++
    } else {
      lastId = 0
      lastTime = now
    }
    const id = padTimestamp(lastTime) + ':' + (('' + lastId).padStart(6, '0'))
    const promise = store.put({ id, timestamp: lastTime, operation })
    return { id, promise }
  }
}

function isSorted(ids) {
  for(let i = 1; i < ids.length; i++) {
    if(ids[i - 1] > ids[i]) return false
  }
  return true
}

test("fire-and-forget writes keep range notifications sorted", async t => {
  t.plan(5)
  const down = await openTestDown(dbPath)
  const store = new Store(down, { prefix: 'o\x00' })

  const putOrder = []
  const rangeObservable = store.rangeObservable({})
  await rangeObservable.readPromise
  const observer = (signal, field, id) => {
    if(signal === 'putByField') putOrder.push(id)
  }
  rangeObservable.observe(observer)

  const writter = createOpLogWritter(store)
  const writes = []
  for(let i = 0; i < 64; i++) {
    writes.push(writter({ type: 'put', i }))
  }
  const expectedIds = writes.map(w => w.id)
  t.ok(isSorted(expectedIds), 'generated opLog ids are monotonic')

  await Promise.all(writes.map(w => w.promise))

  t.deepEqual(putOrder, expectedIds, 'putByField notifications follow call/key order')
  t.deepEqual(rangeObservable.list.map(o => o.id), expectedIds, 'RangeObservable.list stays sorted')

  const fromStore = await store.rangeGet({})
  t.deepEqual(fromStore.map(o => o.id), expectedIds, 'rangeGet matches write order')

  rangeObservable.unobserve(observer)
  await closeTestDown(down, dbPath)
  t.pass('closed')
})

test("disposed RangeObservable ignores in-flight putObject", async t => {
  t.plan(3)
  const down = await openTestDown(dbPath)
  const store = new Store(down, { prefix: 'd\x00' })
  await store.put({ id: 'a', v: 1 })
  await store.put({ id: 'c', v: 3 })

  const rangeObservable = store.rangeObservable({ gte: 'a', lte: 'z' })
  await rangeObservable.readPromise
  t.deepEqual(rangeObservable.list.map(o => o.id), ['a', 'c'], 'initial range')

  const initial = rangeObservable.list.slice()
  let releaseRead
  rangeObservable.readPromise = new Promise(resolve => { releaseRead = resolve })
  const inFlight = rangeObservable.putObject({ id: 'b', v: 2 })
  rangeObservable.dispose()
  t.ok(rangeObservable.disposed, 'observable disposed while putObject awaits')
  releaseRead()
  await inFlight
  t.deepEqual(rangeObservable.list, initial, 'disposed observable list is not mutated')

  await closeTestDown(down, dbPath)
})

test("RangeObservable putObject honors gte/lte bounds", async t => {
  t.plan(2)
  const down = await openTestDown(dbPath)
  const store = new Store(down, { prefix: 'b\x00' })
  await store.put({ id: 'c', v: 1 })
  await store.put({ id: 'e', v: 2 })

  const rangeObservable = store.rangeObservable({ gte: 'c', lte: 'e' })
  await rangeObservable.readPromise
  t.deepEqual(rangeObservable.list.map(o => o.id), ['c', 'e'], 'initial bounded range')

  await rangeObservable.putObject({ id: 'b', v: 0 })
  await rangeObservable.putObject({ id: 'f', v: 3 })
  await rangeObservable.putObject({ id: 'd', v: 4 })
  t.deepEqual(rangeObservable.list.map(o => o.id), ['c', 'd', 'e'], 'out-of-range ids are ignored')

  rangeObservable.dispose()
  await closeTestDown(down, dbPath)
})
