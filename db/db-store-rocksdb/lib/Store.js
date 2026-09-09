import IntervalTreeLib from '@live-change/flatten-interval-tree'
const IntervalTree = IntervalTreeLib.default ?? IntervalTreeLib
import ReactiveDao from "@live-change/dao"

function isNotFound(err) {
  if(!err) return false
  if(err.notFound) return true
  if(err.code === 'LEVEL_NOT_FOUND') return true
  if(err.name === 'NotFoundError') return true
  const text = String(err.message || err)
  return /notfound/i.test(text)
}

function keyToString(key) {
  if(key == null) return ''
  if(typeof key === 'string') return key
  if(Buffer.isBuffer(key)) return key.toString('utf8')
  return String(key)
}

function valueToString(value) {
  if(value == null) return null
  if(typeof value === 'string') return value
  if(Buffer.isBuffer(value)) return value.toString('utf8')
  return String(value)
}

function parseValue(value) {
  const s = valueToString(value)
  if(s == null || s === '') return null
  return JSON.parse(s)
}

function prefixEnd(prefix) {
  if(!prefix) return undefined
  const buf = Buffer.from(prefix, 'utf8')
  for(let i = buf.length - 1; i >= 0; i--) {
    if(buf[i] < 255) {
      buf[i]++
      return buf.slice(0, i + 1).toString('utf8')
    }
  }
  return prefix + '\xFF'
}

function iteratorNext(iterator) {
  return new Promise((resolve, reject) => {
    iterator.next((err, key, value) => {
      if(err) return reject(err)
      if(key === undefined && value === undefined) return resolve(null)
      resolve({ key, value })
    })
  })
}

function iteratorEnd(iterator) {
  return new Promise((resolve, reject) => {
    iterator.end(err => err ? reject(err) : resolve())
  })
}

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

class Store {
  constructor(down, options = {}) {
    this.down = down
    this.prefix = options.prefix || ''
    this.prefixEnd = this.prefix ? prefixEnd(this.prefix) : undefined
    this.objectObservables = new Map()
    this.rangeObservables = new Map()
    this.countObservables = new Map()
    this.rangeObservablesTree = new IntervalTree()
    this.locks = new Map()
  }

  async ready() {
    if(this.down && this.down._opened) await this.down._opened
  }

  encodeKey(id) {
    return this.prefix + id
  }

  decodeKey(key) {
    const s = keyToString(key)
    if(this.prefix && s.startsWith(this.prefix)) return s.slice(this.prefix.length)
    return s
  }

  iteratorRange(range, extra = {}) {
    const opts = {
      reverse: !!range.reverse,
      keyAsBuffer: false,
      valueAsBuffer: false,
      ...extra
    }
    if(range.limit != null) opts.limit = range.limit

    if(range.gt != null) opts.gt = this.encodeKey(range.gt)
    else if(range.gte != null) opts.gte = this.encodeKey(range.gte)
    else if(this.prefix) opts.gte = this.prefix

    if(range.lt != null) opts.lt = this.encodeKey(range.lt)
    else if(range.lte != null) opts.lte = this.encodeKey(range.lte)
    else if(this.prefixEnd) opts.lt = this.prefixEnd

    return opts
  }

  async iterate(opts, onItem) {
    await this.ready()
    const iterator = this.down.iterator(opts)
    try {
      while(true) {
        const pair = await iteratorNext(iterator)
        if(!pair) break
        await onItem(pair)
      }
    } finally {
      await iteratorEnd(iterator)
    }
  }

  downGet(key) {
    return new Promise((resolve, reject) => {
      this.down.get(key, (err, value) => {
        if(err) {
          if(isNotFound(err)) return resolve(null)
          return reject(err)
        }
        resolve(value)
      })
    })
  }

  downPut(key, value) {
    return new Promise((resolve, reject) => {
      this.down.put(key, value, err => err ? reject(err) : resolve())
    })
  }

  downDel(key) {
    return new Promise((resolve, reject) => {
      this.down.del(key, err => {
        if(err && !isNotFound(err)) return reject(err)
        resolve()
      })
    })
  }

  downBatch(ops) {
    if(!ops.length) return Promise.resolve()
    return new Promise((resolve, reject) => {
      this.down.batch(ops, err => err ? reject(err) : resolve())
    })
  }

  downClear(opts) {
    return new Promise((resolve, reject) => {
      this.down.clear(opts, err => err ? reject(err) : resolve())
    })
  }

  async objectGet(key) {
    if(!key) throw new Error("key is required")
    await this.ready()
    const raw = await this.downGet(this.encodeKey(key))
    if(raw == null) return null
    return parseValue(raw)
  }

  objectObservable(key) {
    let observable = this.objectObservables.get(key)
    if(observable) return observable
    observable = new ObjectObservable(this, key)
    return observable
  }

  async rangeGet(range) {
    if(!range) throw new Error("range not defined")
    const data = []
    await this.iterate(this.iteratorRange(range, { keys: true, values: true }), ({ key, value }) => {
      const id = this.decodeKey(key)
      const object = parseValue(value)
      if(object && object.id == null) object.id = id
      data.push(object)
    })
    return data
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
    const rows = []
    await this.iterate(
      this.iteratorRange(range, { keys: true, values: !keysOnly }),
      ({ key, value }) => {
        const id = this.decodeKey(key)
        rows.push({
          id,
          encoded: this.encodeKey(id),
          object: keysOnly ? { id } : parseValue(value)
        })
      }
    )
    await this.downBatch(rows.map(row => ({ type: 'del', key: row.encoded })))
    for(const row of rows) {
      const objectObservable = this.objectObservables.get(row.id)
      if(objectObservable) objectObservable.set(null)
      const rangeObservables = this.rangeObservablesTree.search([row.id, row.id])
      for(const rangeObservable of rangeObservables) {
        await rangeObservable.deleteObject(row.object || { id: row.id })
      }
    }
    return {
      count: rows.length,
      last: rows.length ? rows[rows.length - 1].id : undefined
    }
  }

  async countGet(range) {
    if(!range) throw new Error("range not defined")
    let count = 0
    await this.iterate(this.iteratorRange(range, { keys: true, values: false }), () => {
      count++
    })
    return count
  }

  countObservable(range) {
    let observable = this.countObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new CountObservable(this, range)
    return observable
  }

  async clear() {
    await this.ready()
    const opts = {}
    if(this.prefix) {
      opts.gte = this.prefix
      if(this.prefixEnd) opts.lt = this.prefixEnd
    }
    await this.downClear(opts)
  }

  async put(object) {
    const id = object.id
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    if(!id) throw new Error("ID must not be empty string!")
    let lock
    while(lock = this.locks.get(id)) await lock
    const updateLock = (async () => {
      try {
        await this.ready()
        const raw = await this.downGet(this.encodeKey(id))
        const oldObject = raw == null ? null : parseValue(raw)
        await this.downPut(this.encodeKey(id), JSON.stringify(object))
        const objectObservable = this.objectObservables.get(id)
        if(objectObservable) objectObservable.set(object, oldObject)
        const rangeObservables = this.rangeObservablesTree.search([id, id])
        for(let rangeObservable of rangeObservables) {
          if(rangeObservable.rangeDescr[0] > id) {
            console.error("TREE LEAKING", rangeObservable.rangeDescr[0], ">", id)
            console.error("ID", id, "IS OUT OF", rangeObservable.rangeDescr)
            process.exit(1)
          }
          if(rangeObservable.rangeDescr[1] < id) {
            console.error("TREE LEAKING", rangeObservable.rangeDescr[1], "<", id)
            console.error("ID", id, "IS OUT OF", rangeObservable.rangeDescr)
            process.exit(1)
          }
        }
        for(const rangeObservable of rangeObservables) {
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
        const raw = await this.downGet(this.encodeKey(id))
        const object = raw == null ? null : parseValue(raw)
        if(!object) return null
        await this.downDel(this.encodeKey(id))
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
    return new Promise(async (resolve) => {
      try {
        await this.ready()
        if(typeof this.down.approximateSize !== 'function') {
          return resolve({
            available: false,
            entryCount: null,
            usedBytes: null
          })
        }
        const start = this.prefix || '\x00'
        const end = this.prefixEnd || '\xFF'
        this.down.approximateSize(start, end, (err, size) => {
          if(err) {
            resolve({
              available: false,
              entryCount: null,
              usedBytes: null
            })
            return
          }
          resolve({
            available: true,
            entryCount: null,
            usedBytes: size
          })
        })
      } catch(e) {
        resolve({
          available: false,
          entryCount: null,
          usedBytes: null
        })
      }
    })
  }
}

export default Store
