import test from 'tape'
import { rimraf } from 'rimraf'
import createDb from './utils/createDb.js'
import queryObservableMod from '../lib/queryObservable.js'

const dbPath = './test.qor.db'
rimraf.sync(dbPath)

const QueryReader = queryObservableMod.QueryReader

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

installReaderDebug()

test('T2 queryObservable regression after QueryReader cleanup', (t) => {
  t.plan(5)

  let db, usersTable, messagesTable
  const users = [
    { id: '1', name: 'david' },
    { id: '2', name: 'thomas' }
  ]
  const messages = [
    { id: '1', author: '1', text: 'Hello!' },
    { id: '2', author: '2', text: 'Hi!' }
  ]

  t.test('open database and seed', async (st) => {
    st.plan(1)
    db = createDb(dbPath)
    usersTable = db.createTable('users')
    messagesTable = db.createTable('messages')
    for (const user of users) await usersTable.put(user)
    for (const message of messages) await messagesTable.put(message)
    st.pass('seeded')
  })

  t.test('T2.1 query-users-change-forwarding', async (st) => {
    st.plan(2)
    let latest
    let pending = null
    const query = db.queryObservable(async (input, output) => {
      await input.table('users').onChange((obj, oldObj) => {
        output.change(obj, oldObj)
      })
    })
    const handler = (signal, value) => {
      if (signal === 'set' || signal === 'put' || signal === 'push') {
        latest = query.list
        if (pending && pending.pred(latest)) {
          const resolve = pending.resolve
          pending = null
          resolve(latest)
        }
      }
    }
    query.observe(handler)
    await query.readPromise
    await delay(50)
    st.ok(Array.isArray(query.list) && query.list.length >= 2, 'initial users listed')
    const waitFor = (pred) => {
      if (pred(query.list)) return query.list
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending = null
          reject(new Error('T2.1 timeout'))
        }, 5000)
        pending = {
          pred,
          resolve: (v) => {
            clearTimeout(timer)
            resolve(v)
          }
        }
      })
    }
    await usersTable.put({ id: '3', name: 'george' })
    const updated = await waitFor((list) => list && list.some((u) => u.id === '3'))
    st.ok(updated.some((u) => u.id === '3' && u.name === 'george'), 'put forwarded to query')
    query.unobserve(handler)
  })

  t.test('T2.2 query-join-object-change', async (st) => {
    st.plan(2)
    let pending = null
    const query = db.queryObservable(async (input, output) => {
      const messagesTbl = input.table('messages')
      const usersTbl = input.table('users')
      await messagesTbl.onChange((obj, oldObj) => {
        return output.synchronized(obj ? obj.id : oldObj.id, async () => {
          const user = obj && await usersTbl.object(obj.author).get()
          output.change(obj && { user, ...obj }, oldObj)
        })
      })
    })
    const handler = (signal) => {
      if (signal === 'set' || signal === 'put' || signal === 'push') {
        if (pending && pending.pred(query.list)) {
          const resolve = pending.resolve
          pending = null
          resolve(query.list)
        }
      }
    }
    query.observe(handler)
    await query.readPromise
    await delay(80)
    st.ok(query.list.some((m) => m.id === '1' && m.user && m.user.name === 'david'),
      'join includes user')
    const waitFor = (pred) => {
      if (pred(query.list)) return query.list
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending = null
          reject(new Error('T2.2 timeout'))
        }, 5000)
        pending = {
          pred,
          resolve: (v) => {
            clearTimeout(timer)
            resolve(v)
          }
        }
      })
    }
    await messagesTable.put({ id: '3', author: '2', text: 'later' })
    const updated = await waitFor((list) =>
      list && list.some((m) => m.id === '3' && m.user && m.user.name === 'thomas')
    )
    st.ok(updated.some((m) => m.id === '3' && m.user.name === 'thomas'),
      'new message forwarded with joined user')
    query.unobserve(handler)
  })

  t.test('T2.3 index-range-object-change', async (st) => {
    st.plan(3)
    let pending = null
    const query = db.queryObservable(async (input, output) => {
      const objectStates = new Map()
      await input.table('messages').range({}).onChange(async (obj, oldObj) => {
        if (obj && obj.id) {
          let objectState = objectStates.get(obj.id)
          if (!objectState) {
            objectState = { data: undefined, refs: 1 }
            objectState.reader = input.table('messages').object(obj.id)
            objectState.observer = await objectState.reader.onChange(async (row) => {
              const oldData = objectState.data
              output.change(row, oldData)
              objectState.data = row || null
            })
            objectStates.set(obj.id, objectState)
          } else if (!oldObj) {
            objectState.refs++
          }
        }
        if (oldObj && oldObj.id && (!obj || obj.id !== oldObj.id)) {
          let objectState = objectStates.get(oldObj.id)
          if (objectState) {
            objectState.refs--
            if (objectState.refs <= 0) {
              await objectState.reader.unobserve(objectState.observer)
              objectStates.delete(oldObj.id)
              output.change(null, objectState.data)
            }
          }
        }
      })
    })
    const handler = (signal) => {
      if (signal === 'set' || signal === 'put' || signal === 'push' || signal === 'remove') {
        if (pending && pending.pred(query.list)) {
          const resolve = pending.resolve
          pending = null
          resolve(query.list)
        }
      }
    }
    query.observe(handler)
    await query.readPromise
    await delay(80)
    st.ok(query.list.some((m) => m.id === '1'), 'index range lists messages')
    const sizeBeforeDelete = readersSize(query)
    const waitFor = (pred) => {
      if (pred(query.list)) return query.list
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending = null
          reject(new Error('T2.3 timeout'))
        }, 5000)
        pending = {
          pred,
          resolve: (v) => {
            clearTimeout(timer)
            resolve(v)
          }
        }
      })
    }
    await messagesTable.delete('2')
    await waitFor((list) => list && !list.some((m) => m.id === '2'))
    await flush()
    await delay(40)
    st.ok(!query.list.some((m) => m.id === '2'), 'deleted message removed from query')
    st.ok(readersSize(query) < sizeBeforeDelete, 'unobserve dropped ObjectReader from #readers')
    query.unobserve(handler)
  })

  t.test('close and remove database', async (st) => {
    st.plan(1)
    await rimraf(dbPath)
    st.pass('removed')
  })
})
