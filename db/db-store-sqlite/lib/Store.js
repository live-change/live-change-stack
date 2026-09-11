import IntervalTreeLib from '@live-change/flatten-interval-tree'
const IntervalTree = IntervalTreeLib.default ?? IntervalTreeLib
import ReactiveDao from "@live-change/dao"
import { tableName, quoteIdent, createTableSql } from './ident.js'

class ObjectObservable extends ReactiveDao.ObservableValue {
  constructor(store, key) {
    super()
    this.store = store
    this.key = key

    this.disposed = false
    this.ready = false
    this.respawnId = 0

    this.forward = null

    this.readPromise = this.startReading()
  }

  async startReading() {
    this.store.objectObservables.set(this.key, this)
    this.value = await this.store.objectGet(this.key)
    this.fireObservers('set', this.value)
  }

  async set(value) {
    await this.readPromise
    this.value = value
    this.fireObservers('set', this.value)
  }

  dispose() {
    if(this.forward) {
      this.forward.unobserve(this)
      this.forward = null
      return
    }

    this.disposed = true
    this.respawnId++
    if(this.changesStream) this.changesStream.close()
    this.changesStream = null

    this.store.objectObservables.delete(this.key)
  }

  respawn() {
    const existingObservable = this.store.objectObservables.get(this.key)
    if(existingObservable) {
      this.forward = existingObservable
      this.forward.observe(this)
      return
    }

    this.respawnId++
    if(this.changesStream) this.changesStream.close()
    this.ready = false
    this.disposed = false
    this.startReading()
  }
}

class RangeObservable extends ReactiveDao.ObservableList {
  constructor(store, range) {
    super()
    this.store = store
    this.range = range

    this.disposed = false
    this.ready = false
    this.respawnId = 0
    this.refillId = 0
    this.refillPromise = null

    this.forward = null

    this.rangeKey = JSON.stringify(this.range)
    this.rangeDescr = [ this.range.gt || this.range.gte || '', this.range.lt || this.range.lte || '\xFF\xFF\xFF\xFF' ]

    this.readPromise = this.startReading()
  }

  async startReading() {
    this.store.rangeObservables.set(this.rangeKey, this)
    this.store.rangeObservablesTree.insert(this.rangeDescr, this)
    this.set(await this.store.rangeGet(this.range))
  }

  async putObject(object, oldObject) {
    await this.readPromise
    const id = object.id
    if(this.range.gt && !(id > this.range.gt)) return
    if(this.range.lt && !(id < this.range.lt)) return
    if(!this.range.reverse) {
      if(this.range.limit && this.list.length == this.range.limit) {
        for(let i = 0, l = this.list.length; i < l; i++) {
          if(this.list[i].id == id) {
            this.list.splice(i, 1, object)
            this.fireObservers('putByField', 'id', id, object, false, oldObject)
            return
          } else if(this.list[i].id > id) {
            this.list.splice(i, 0, object)
            this.fireObservers('putByField', 'id', id, object, false, oldObject)
            const popped = this.list.pop()
            this.fireObservers('removeByField', 'id', popped.id, popped)
            return
          }
        }
      } else {
        this.putByField('id', object.id, object, false, oldObject)
      }
    } else {
      if(this.range.limit && this.list.length == this.range.limit) {
        for(let i = this.list.length-1; i >= 0; i--) {
          if(this.list[i].id == id) {
            this.list.splice(i, 1, object)
            this.fireObservers('putByField', 'id', id, object, true, oldObject)
            return
          } else if(this.list[i].id > id) {
            if(i == this.list.length - 1) return
            this.list.splice(i + 1, 0, object)
            this.fireObservers('putByField', 'id', id, object, true, oldObject)
            const popped = this.list.pop()
            this.fireObservers('removeByField', 'id', popped.id, popped)
            return
          }
        }
        this.list.splice(0, 0, object)
        this.fireObservers('putByField', 'id', id, object, true)
        const popped = this.list.pop()
        this.fireObservers('removeByField', 'id', popped.id, popped)
      } else {
        this.putByField('id', id, object, true, oldObject)
      }
    }
  }

  refillDeleted(from, limit) {
    this.refillId ++
    const refillId = this.refillId
    let promise = (async () => {
      let req
      if(!this.range.reverse) {
        req = { gt: from, limit }
        if(this.range.lt) req.lt = this.range.lt
        if(this.range.lte) req.lte = this.range.lte
      } else {
        req = { lt: from, limit, reverse: true }
        if(this.range.gt) req.gt = this.range.gt
        if(this.range.gte) req.gte = this.range.gte
      }
      const objects = await this.store.rangeGet(req)
      if(this.refillId != refillId) return this.refillPromise
      for(let object of objects) this.push(object)
      this.refillPromise = null
    })()
    this.refillPromise = promise
    return promise
  }

  async deleteObject(object) {
    if(!object) return
    await this.readPromise
    const id = object.id
    if(this.range.gt && !(id > this.range.gt)) return
    if(this.range.lt && !(id < this.range.lt)) return
    if(this.range.limit && (this.list.length == this.range.limit || this.refillPromise)) {
      let exists
      let last
      for(let obj of this.list) {
        if(obj.id == id) exists = obj
        else last = obj
      }
      this.removeByField('id', id, object)
      if(exists) await this.refillDeleted(
          last && last.id || (this.reverse ? this.range.lt || this.range.lte : this.range.gt || this.range.gte),
          this.range.limit - this.list.length)
    } else {
      this.removeByField('id', id, object)
    }
  }

  dispose() {
    if(this.forward) {
      this.forward.unobserve(this)
      this.forward = null
      return
    }

    this.disposed = true
    this.respawnId++
    this.changesStream = null

    this.store.rangeObservables.delete(this.rangeKey)
    this.store.rangeObservablesTree.remove(this.rangeDescr, this)
  }

  respawn() {
    const existingObservable = this.store.rangeObservables.get(JSON.stringify(this.range))
    if(existingObservable) {
      this.forward = existingObservable
      this.forward.observe(this)
      return
    }

    this.respawnId++
    this.ready = false
    this.disposed = false
    this.startReading()
  }
}

class CountObservable extends ReactiveDao.ObservableValue {
  constructor(store, range) {
    super()
    this.store = store
    this.range = range

    this.disposed = false
    this.ready = false
    this.respawnId = 0
    this.refillId = 0
    this.refillPromise = null

    this.forward = null

    this.rangeKey = JSON.stringify(this.range)
    this.rangeDescr = [ this.range.gt || this.range.gte || '', this.range.lt || this.range.lte || '\xFF\xFF\xFF\xFF']

    this.readPromise = this.startReading()
  }

  async startReading() {
    this.store.countObservables.set(this.rangeKey, this)
    this.store.rangeObservablesTree.insert(this.rangeDescr, this)
    this.set(await this.store.countGet(this.range))
  }

  async putObject(object, oldObject) {
    const id = object.id
    if(this.range.gt && !(id > this.range.gt)) return
    if(this.range.lt && !(id < this.range.lt)) return
    await this.readPromise
    if(this.range.limit) {
      this.set(await this.store.countGet(this.range))
    } else {
      if(object && !oldObject) {
        this.set(this.value + 1)
      } else if(!object && oldObject) {
        this.set(this.value - 1)
      }
    }
  }

  async deleteObject(object) {
    if(!object) return
    const id = object.id
    if(this.range.gt && !(id > this.range.gt)) return
    if(this.range.lt && !(id < this.range.lt)) return
    this.set(this.value - 1)
  }

  dispose() {
    if(this.forward) {
      this.forward.unobserve(this)
      this.forward = null
      return
    }

    this.disposed = true
    this.respawnId++
    this.changesStream = null

    this.store.countObservables.delete(this.rangeKey)
    this.store.rangeObservablesTree.remove(this.rangeDescr, this)
  }

  respawn() {
    const existingObservable = this.store.countObservables.get(JSON.stringify(this.range))
    if(existingObservable) {
      this.forward = existingObservable
      this.forward.observe(this)
      return
    }

    this.respawnId++
    this.ready = false
    this.disposed = false
    this.startReading()
  }
}

function parseValue(raw) {
  if(raw == null || raw === '') return null
  return JSON.parse(raw)
}

function rangeClause(range = {}) {
  const parts = []
  const params = {}
  if(range.gt != null) {
    parts.push('id > @gt')
    params.gt = range.gt
  } else if(range.gte != null) {
    parts.push('id >= @gte')
    params.gte = range.gte
  }
  if(range.lt != null) {
    parts.push('id < @lt')
    params.lt = range.lt
  } else if(range.lte != null) {
    parts.push('id <= @lte')
    params.lte = range.lte
  }
  const where = parts.length ? ' WHERE ' + parts.join(' AND ') : ''
  const order = range.reverse ? ' ORDER BY id DESC' : ' ORDER BY id ASC'
  let limit = ''
  if(range.limit != null) {
    limit = ' LIMIT @limit'
    params.limit = range.limit
  }
  return { where, order, limit, params }
}

class Store {
  constructor(db, options = {}) {
    this.db = db
    this.name = options.name || 'data'
    this.table = tableName(this.name)
    this.quoted = quoteIdent(this.table)
    this.objectObservables = new Map()
    this.rangeObservables = new Map()
    this.countObservables = new Map()
    this.rangeObservablesTree = new IntervalTree()
    this.locks = new Map()
    this.stmtCache = new Map()
    this.ensureTable()
    this.prepareCore()
  }

  async ready() {}

  ensureTable() {
    this.db.exec(createTableSql(this.quoted))
  }

  prepareCore() {
    const t = this.quoted
    this.stmtGet = this.db.prepare(`SELECT value FROM ${t} WHERE id = ?`)
    this.stmtPut = this.db.prepare(
      `INSERT INTO ${t}(id, value) VALUES(?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`
    )
    this.stmtDel = this.db.prepare(`DELETE FROM ${t} WHERE id = ?`)
    this.stmtClear = this.db.prepare(`DELETE FROM ${t}`)
    this.stmtCountAll = this.db.prepare(`SELECT COUNT(*) AS n FROM ${t}`)
    this.writeTxn = this.db.transaction((id, json) => {
      const row = this.stmtGet.get(id)
      this.stmtPut.run(id, json)
      return row ? row.value : null
    })
    this.deleteTxn = this.db.transaction((id) => {
      const row = this.stmtGet.get(id)
      if(!row) return null
      this.stmtDel.run(id)
      return row.value
    })
  }

  cachedStmt(key, sql) {
    let stmt = this.stmtCache.get(key)
    if(!stmt) {
      stmt = this.db.prepare(sql)
      this.stmtCache.set(key, stmt)
    }
    return stmt
  }

  rangeSql(range, { columns, forDelete = false } = {}) {
    const { where, order, limit, params } = rangeClause(range)
    const t = this.quoted
    let sql
    if(forDelete) {
      if(limit) {
        sql = `DELETE FROM ${t} WHERE id IN (SELECT id FROM ${t}${where}${order}${limit}) RETURNING ${columns}`
      } else {
        sql = `DELETE FROM ${t}${where} RETURNING ${columns}`
      }
    } else {
      sql = `SELECT ${columns} FROM ${t}${where}${order}${limit}`
    }
    return { sql, params }
  }

  objectGet(key) {
    if(!key) throw new Error("key is required")
    const row = this.stmtGet.get(key)
    if(!row) return Promise.resolve(null)
    return Promise.resolve(parseValue(row.value))
  }

  objectObservable(key) {
    let observable = this.objectObservables.get(key)
    if(observable) return observable
    observable = new ObjectObservable(this, key)
    return observable
  }

  rangeGet(range) {
    if(!range) throw new Error("range not defined")
    const { sql, params } = this.rangeSql(range, { columns: 'id, value' })
    const stmt = this.cachedStmt('range:' + sql, sql)
    const data = []
    for(const row of stmt.iterate(params)) {
      const object = parseValue(row.value)
      if(object && object.id == null) object.id = row.id
      data.push(object)
    }
    return Promise.resolve(data)
  }

  rangeObservable(range) {
    let observable = this.rangeObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new RangeObservable(this, range)
    return observable
  }

  async rangeDelete(range, options = {}) {
    if(!range) throw new Error("range not defined")
    const keysOnly = options.keysOnly === true
    const columns = keysOnly ? 'id' : 'id, value'
    const { sql, params } = this.rangeSql(range, { columns, forDelete: true })
    const stmt = this.cachedStmt('del:' + sql, sql)
    const rows = stmt.all(params)
    for(const row of rows) {
      const object = keysOnly ? { id: row.id } : parseValue(row.value)
      if(object && object.id == null) object.id = row.id
      const objectObservable = this.objectObservables.get(row.id)
      if(objectObservable) objectObservable.set(null)
      const rangeObservables = this.rangeObservablesTree.search([row.id, row.id])
      for(const rangeObservable of rangeObservables) {
        await rangeObservable.deleteObject(object || { id: row.id })
      }
    }
    return {
      count: rows.length,
      last: rows.length ? rows[rows.length - 1].id : undefined
    }
  }

  countGet(range) {
    if(!range) throw new Error("range not defined")
    const { where, order, limit, params } = rangeClause(range)
    const t = this.quoted
    const sql = limit
      ? `SELECT COUNT(*) AS n FROM (SELECT id FROM ${t}${where}${order}${limit})`
      : `SELECT COUNT(*) AS n FROM ${t}${where}`
    const stmt = this.cachedStmt('count:' + sql, sql)
    const row = stmt.get(params)
    return Promise.resolve(row ? row.n : 0)
  }

  countObservable(range) {
    let observable = this.countObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new CountObservable(this, range)
    return observable
  }

  async clear() {
    this.stmtClear.run()
  }

  drop() {
    this.db.exec(`DROP TABLE IF EXISTS ${this.quoted}`)
    this.stmtCache.clear()
  }

  async put(object) {
    const id = object.id
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    if(!id) throw new Error("ID must not be empty string!")
    let lock
    while(lock = this.locks.get(id)) await lock
    const updateLock = (async () => {
      try {
        // Yield so locks.set below runs before this function can finish.
        await this.ready()
        const raw = this.writeTxn(id, JSON.stringify(object))
        const oldObject = raw == null ? null : parseValue(raw)
        const objectObservable = this.objectObservables.get(id)
        if(objectObservable) objectObservable.set(object, oldObject)
        const rangeObservables = this.rangeObservablesTree.search([id, id])
        for(const rangeObservable of rangeObservables) {
          if(rangeObservable.rangeDescr[0] > id || rangeObservable.rangeDescr[1] < id) {
            console.error("TREE LEAKING", "ID", id, "IS OUT OF", rangeObservable.rangeDescr)
            continue
          }
          await rangeObservable.putObject(object, oldObject)
        }
        return oldObject
      } finally {
        this.locks.delete(id)
      }
    })()
    this.locks.set(id, updateLock)
    return await updateLock
  }

  async delete(id) {
    let lock
    while(lock = this.locks.get(id)) await lock
    const deleteLock = (async () => {
      try {
        await this.ready()
        const raw = this.deleteTxn(id)
        const object = raw == null ? null : parseValue(raw)
        if(!object) return null
        const objectObservable = this.objectObservables.get(id)
        if(objectObservable) objectObservable.set(null)
        const rangeObservables = this.rangeObservablesTree.search([id, id])
        for(const rangeObservable of rangeObservables) {
          await rangeObservable.deleteObject(object)
        }
        return object
      } finally {
        this.locks.delete(id)
      }
    })()
    this.locks.set(id, deleteLock)
    return await deleteLock
  }

  stat() {
    try {
      const entryCount = this.stmtCountAll.get().n
      const pageCount = this.db.pragma('page_count', { simple: true })
      const pageSize = this.db.pragma('page_size', { simple: true })
      return {
        available: true,
        entryCount,
        usedBytes: pageCount * pageSize,
        pageSize
      }
    } catch(e) {
      return {
        available: false,
        entryCount: null,
        usedBytes: null
      }
    }
  }
}

export default Store
