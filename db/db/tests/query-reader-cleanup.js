import test from 'tape'
import { rimraf } from 'rimraf'
import createDb from './utils/createDb.js'
import queryObservable from '../lib/queryObservable.js'

const dbPath = './test.qrc.db'
rimraf.sync(dbPath)

const QueryReader = queryObservable.QueryReader

function installReaderDebug() {
  if (QueryReader.prototype._debugInstalled) return
  QueryReader.prototype._debugInstalled = true
  const origGet = QueryReader.prototype.getExistingReaderOrCreate
  QueryReader.prototype.getExistingReaderOrCreate = function(key, create) {
    if (!this.debugReaderKeys) this.debugReaderKeys = new Set()
    const result = origGet.call(this, key, create)
    const track = (rd) => {
      this.debugReaderKeys.add(key)
      return rd
    }
    if (result && typeof result.then === 'function') return result.then(track)
    return track(result)
  }
  const origRelease = QueryReader.prototype.releaseReader
  QueryReader.prototype.releaseReader = function(key) {
    if (this.debugReaderKeys) this.debugReaderKeys.delete(key)
    if (typeof origRelease === 'function') return origRelease.call(this, key)
  }
}

function readersSize(query) {
  return query?.reader?.debugReaderKeys?.size ?? 0
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve))
}

function attachValueWaiter(observable) {
  let last
  let waiter = null
  const handler = {
    set(value) {
      last = value
      if (waiter && waiter.pred(value)) {
        const resolve = waiter.resolve
        waiter = null
        resolve(value)
      }
    }
  }
  observable.observe(handler)
  return {
    handler,
    async waitFor(pred, timeoutMs = 5000) {
      if (pred(last)) return last
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          waiter = null
          reject(new Error('waitFor timeout'))
        }, timeoutMs)
        waiter = {
          pred,
          resolve: (value) => {
            clearTimeout(timer)
            resolve(value)
          }
        }
      })
    }
  }
}

installReaderDebug()

test('T1 QueryReader #readers cleanup', (t) => {
  t.plan(9)

  let db, items

  t.test('open database', async (st) => {
    st.plan(1)
    db = createDb(dbPath)
    items = db.createTable('items')
    await items.put({ id: 'cursor', target: null })
    await items.put({ id: 'x', name: 'same' })
    await items.put({ id: 'a', name: 'alpha' })
    await items.put({ id: 'b', name: 'beta' })
    st.pass('opened')
  })

  t.test('T1.1 object-reader-reused', async (st) => {
    st.plan(1)
    const query = db.queryObjectObservable(async (input, output) => {
      const table = input.table('items')
      await table.object('x').onChange((row) => {
        output.put({ id: 'r1', from: row?.id })
      })
      await table.object('x').onChange((row) => {
        output.put({ id: 'r2', from: row?.id })
      })
    })
    const waiter = attachValueWaiter(query)
    await query.readPromise
    await waiter.waitFor((v) => v && (v.id === 'r1' || v.id === 'r2'))
    st.equal(readersSize(query), 2, 'table + one ObjectReader for x, not two')
    query.unobserve(waiter.handler)
  })

  t.test('T1.2 object-reader-dispose-drops-from-map', async (st) => {
    st.plan(2)
    let childObserver = null
    const query = db.queryObjectObservable(async (input, output) => {
      const table = input.table('items')
      await table.object('cursor').onChange(async (cursor) => {
        if (childObserver) {
          await childObserver.dispose()
          childObserver = null
        }
        const target = cursor?.target
        if (!target) {
          output.put({ id: 'result', target: null })
          return
        }
        childObserver = await table.object(target).onChange((row) => {
          output.put({ id: 'result', target: row?.id ?? target })
        })
      })
    })
    const waiter = attachValueWaiter(query)
    await query.readPromise
    await waiter.waitFor((v) => v && v.id === 'result' && v.target == null)
    const baseSize = readersSize(query)
    await items.put({ id: 'cursor', target: 'a' })
    await waiter.waitFor((v) => v && v.target === 'a')
    st.equal(readersSize(query), baseSize + 1, 'child ObjectReader added')
    await items.put({ id: 'cursor', target: 'b' })
    await waiter.waitFor((v) => v && v.target === 'b')
    await flush()
    await delay(20)
    st.equal(readersSize(query), baseSize + 1, 'old child dropped, only current child remains')
    query.unobserve(waiter.handler)
  })

  t.test('T1.3 many-unique-ids-then-dispose', async (st) => {
    st.plan(1)
    let childObserver = null
    const query = db.queryObjectObservable(async (input, output) => {
      const table = input.table('items')
      await table.object('cursor').onChange(async (cursor) => {
        if (childObserver) {
          await childObserver.dispose()
          childObserver = null
        }
        const target = cursor?.target
        if (!target) {
          output.put({ id: 'result', target: null })
          return
        }
        childObserver = await table.object(target).onChange((row) => {
          output.put({ id: 'result', target: row?.id ?? target })
        })
      })
    })
    const waiter = attachValueWaiter(query)
    await query.readPromise
    await waiter.waitFor((v) => v && v.id === 'result')
    const baseSize = readersSize(query)
    const n = 40
    for (let i = 0; i < n; i++) {
      const id = `u-${i}`
      await items.put({ id, n: i })
      await items.put({ id: 'cursor', target: id })
      await waiter.waitFor((v) => v && v.target === id)
    }
    await flush()
    await delay(20)
    st.ok(readersSize(query) <= baseSize + 2, `readers stayed bounded, got ${readersSize(query)}`)
    query.unobserve(waiter.handler)
  })

  t.test('T1.4 query-dispose-clears-map', async (st) => {
    st.plan(1)
    const query = db.queryObjectObservable(async (input, output) => {
      await input.table('items').object('x').onChange((row) => {
        output.put({ id: 'result', from: row?.id })
      })
    })
    const waiter = attachValueWaiter(query)
    await query.readPromise
    await waiter.waitFor((v) => v && v.id === 'result')
    query.dispose()
    await flush()
    await delay(40)
    st.equal(readersSize(query), 0, 'QueryReader.dispose clears #readers')
  })

  t.test('T1.5 observer-dispose-idempotent', async (st) => {
    st.plan(2)
    let childObserver = null
    const query = db.queryObjectObservable(async (input, output) => {
      childObserver = await input.table('items').object('x').onChange((row) => {
        output.put({ id: 'result', from: row?.id })
      })
    })
    const waiter = attachValueWaiter(query)
    await query.readPromise
    await waiter.waitFor((v) => v && v.id === 'result')
    await childObserver.dispose()
    let threw = false
    try {
      await childObserver.dispose()
    } catch (err) {
      threw = true
    }
    st.equal(threw, false, 'second observer.dispose does not throw')
    st.ok(readersSize(query) <= 1, 'releaseReader not duplicated past empty')
    query.unobserve(waiter.handler)
  })

  t.test('T1.6 range-reader-dispose-drops-from-map', async (st) => {
    st.plan(2)
    let rangeObserver = null
    const query = db.queryObjectObservable(async (input, output) => {
      const table = input.table('items')
      rangeObserver = await table.range({}).onChange((row) => {
        if (row) output.put({ id: 'last', from: row.id })
      })
    })
    const waiter = attachValueWaiter(query)
    await query.readPromise
    await waiter.waitFor((v) => v && v.id === 'last')
    const withRange = readersSize(query)
    st.ok(withRange >= 2, 'table + range reader present')
    await rangeObserver.dispose()
    await flush()
    await delay(20)
    st.equal(readersSize(query), withRange - 1, 'RangeReader dropped from #readers')
    query.unobserve(waiter.handler)
  })

  t.test('T1.7 respawn-reobserves', async (st) => {
    st.plan(2)
    const query = db.queryObjectObservable(async (input, output) => {
      await input.table('items').object('x').onChange((row) => {
        output.put({ id: 'result', from: row?.id, name: row?.name })
      })
    })
    const waiter = attachValueWaiter(query)
    await query.readPromise
    await waiter.waitFor((v) => v && v.id === 'result')
    query.dispose()
    await flush()
    st.equal(readersSize(query), 0, 'disposed query has empty #readers')
    query.respawn()
    const waiter2 = attachValueWaiter(query)
    await query.readPromise
    await waiter2.waitFor((v) => v && v.id === 'result')
    st.ok(readersSize(query) >= 2, 'respawn creates a fresh QueryReader with readers')
    query.unobserve(waiter2.handler)
  })

  t.test('close and remove database', async (st) => {
    st.plan(1)
    await rimraf(dbPath)
    st.pass('removed')
  })
})
