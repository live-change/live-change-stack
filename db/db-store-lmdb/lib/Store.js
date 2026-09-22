import IntervalTreeLib from '@live-change/flatten-interval-tree'
const IntervalTree = IntervalTreeLib.default
import ReactiveDao from "@live-change/dao"
import lmdb from 'node-lmdb'
import Debug from 'debug'

const debugPut = Debug('db:profilePut')
const loggedEnvs = new WeakSet()
const LMDB_SLOW_MS = Number(process.env.LMDB_SLOW_MS || 50)

function withLmdbNative(info, fn) {
  const t = globalThis.__lcNativeTrace
  const started = performance.now()
  t?.enter(info)
  try {
    return fn()
  } finally {
    const dtMs = performance.now() - started
    t?.leave(dtMs)
    if (dtMs >= LMDB_SLOW_MS) {
      console.log('[lmdb] slow', { ...info, dtMs: Math.round(dtMs) })
    }
  }
}

function idInRange(id, range) {
  if(range.gt && !(id > range.gt)) return false
  if(range.gte && !(id >= range.gte)) return false
  if(range.lt && !(id < range.lt)) return false
  if(range.lte && !(id <= range.lte)) return false
  return true
}

function logEnvOnce(env, storeName) {
  if(!debugPut.enabled || !env || loggedEnvs.has(env)) return
  loggedEnvs.add(env)
  let info = null
  let stat = null
  try { info = env.info() } catch(e) { info = { error: String(e) } }
  try { stat = env.stat() } catch(e) { stat = { error: String(e) } }
  debugPut(
    'env.info store=%s path=%s openConfig=%o info=%o stat=%o',
    storeName || '?',
    env.path,
    env.openConfig || null,
    info,
    stat
  )
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
    this.refillQueue = []
    this.refillRunning = false

    this.forward = null

    this.rangeKey = JSON.stringify(this.range)
    this.rangeDescr = [ this.range.gt || this.range.gte || '', this.range.lt || this.range.lte || '\xFF\xFF\xFF\xFF']

    this.readPromise = this.startReading()
  }

  async startReading() {
    this.store.rangeObservables.set(this.rangeKey, this)
    const treeInsert = this.rangeDescr
    const inserted = this.store.rangeObservablesTree.insert(treeInsert, this)
    if(this.store.rangeObservablesTree.search([this.low, this.high]).length == 0) {
      console.error("TREE NOT WORKING")
      console.log("INSERTED", JSON.stringify(treeInsert),
          "TO TREE", this.store.rangeObservablesTree)
      console.log("FOUND", this.store.rangeObservablesTree.search(this.rangeDescr))
      console.log("ALL RECORDS", this.store.rangeObservablesTree.search(['', '\xFF\xFF\xFF\xFF']))
      process.exit(1)
    }
    this.set(await this.store.rangeGet(this.range))
  }

  async putObject(object, oldObject) {
    await this.readPromise
    if(this.disposed) return
    const id = object.id
    if(!idInRange(id, this.range)) return
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
            if(i == this.list.length - 1) return // last element is bigger, do nothing
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

  refillDeleted(from, need) {
    if(this.disposed) return Promise.resolve()
    return new Promise((resolve, reject) => {
      this.refillQueue.push({ from, need, resolve, reject })
      this._drainRefill()
    })
  }

  async _syncWindow() {
    if(this.disposed || !this.range.limit) return
    const reverse = !!this.range.reverse
    const truth = await this.store.rangeGet(this.range)
    if(this.disposed) return
    const same = truth.length === this.list.length &&
      truth.every((o, i) => this.list[i] && this.list[i].id === o.id)
    if(same) return
    const truthIds = new Set(truth.map(o => o.id))
    for(const obj of this.list.slice()) {
      if(!truthIds.has(obj.id)) this.removeByField('id', obj.id, obj)
    }
    for(const object of truth) {
      this.putByField('id', object.id, object, reverse)
    }
    while(this.list.length > truth.length) {
      const popped = this.list.pop()
      this.fireObservers('removeByField', 'id', popped.id, popped)
    }
    while(this.range.limit && this.list.length > this.range.limit) {
      const popped = this.list.pop()
      this.fireObservers('removeByField', 'id', popped.id, popped)
    }
  }

  async _drainRefill() {
    if(this.refillRunning) return
    this.refillRunning = true
    const allJobs = []
    try {
      while(this.refillQueue.length) {
        allJobs.push(...this.refillQueue.splice(0))
        await this._syncWindow()
      }
      await this._syncWindow()
    } catch(err) {
      this.refillRunning = false
      for(const job of allJobs) job.reject(err)
      for(const job of this.refillQueue.splice(0)) job.reject(err)
      return
    }
    this.refillRunning = false
    for(const job of allJobs) job.resolve()
    if(this.refillQueue.length) this._drainRefill()
  }

  async deleteObject(object) {
    if(!object) return
    await this.readPromise
    if(this.disposed) return
    const id = object.id
    if(!idInRange(id, this.range)) return
    let exists = false, last = null
    for(let obj of this.list) {
      if(obj.id == id) exists = obj
      else last = obj
    }
    this.removeByField('id', id, object)
    if(exists && this.range.limit) {
      const need = this.range.limit - this.list.length
      if(need > 0) await this.refillDeleted(
        last && last.id || (this.range.reverse ? this.range.lt || this.range.lte : this.range.gt || this.range.gte),
        need)
    }
  }

  dispose() {
    if(this.forward) {
      this.forward.unobserve(this)
      this.forward = null
      return
    }

    this.disposed = true
    const pending = this.refillQueue.splice(0)
    for(const job of pending) job.resolve()
    this.respawnId++
    this.changesStream = null

    this.store.rangeObservables.delete(this.rangeKey)
    let removed = this.store.rangeObservablesTree.remove(this.rangeDescr, this)
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
    this.refillQueue = []
    this.refillRunning = false
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
    this.store.rangeObservables.set(this.rangeKey, this)
    const treeInsert = this.rangeDescr
    const inserted = this.store.rangeObservablesTree.insert(treeInsert, this)
    if(this.store.rangeObservablesTree.search([this.low, this.high]).length === 0) {
      console.error("TREE NOT WORKING")
      console.log("INSERTED", JSON.stringify(treeInsert),
          "TO TREE", this.store.rangeObservablesTree)
      console.log("FOUND", this.store.rangeObservablesTree.search(this.rangeDescr))
      console.log("ALL RECORDS", this.store.rangeObservablesTree.search(['', '\xFF\xFF\xFF\xFF']))
      process.exit(1)
    }
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

    this.store.rangeObservables.delete(this.rangeKey)
    let removed = this.store.rangeObservablesTree.remove(this.rangeDescr, this)
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

class Store {
  constructor(env, db, options = {}) {
    this.env = env
    this.lmdb = db
    this.name = options.name || null

    const {
      serialization = JSON
    } = options
    this.serialization = serialization

    this.objectObservables = new Map()
    this.rangeObservables = new Map()
    this.countObservables = new Map()
    this.rangeObservablesTree = new IntervalTree()
  }

  objectGet(key) {
    if(!key) throw new Error("key is required")
    return withLmdbNative({ op: 'objectGet', store: this.name, id: key }, () => {
      const txn = this.env.beginTxn()
      let json
      try {
        json = txn.getString(this.lmdb, key)
      } catch(error) {

      } finally {
        txn.commit()
      }
      if(!json) return Promise.resolve(null)
      try {
        const obj = JSON.parse(json)
        return Promise.resolve(obj)
      } catch(e) {
        return Promise.reject(e)
      }
    })
  }

  objectObservable(key) {
    let observable = this.objectObservables.get(key)
    if(observable) return observable
    observable = new ObjectObservable(this, key)
    return observable
  }

  rangeGet(range) {  
    if(!range) throw new Error("range not defined")      
    return new Promise((resolve, reject) => {
      withLmdbNative({ op: 'rangeGet', store: this.name, range }, () => {
      let keys = []
      let data
      let found
      //console.log("TXN [")
      const txn = this.env.beginTxn()
      try {
        //console.log("  FETCH KEYS [")
        let cursor = new lmdb.Cursor(txn, this.lmdb)
        try {
          const min = range.gt || range.gte
          const max = range.lt || range.lte
          if(range.reverse) {
            if(max) {
              found = cursor.goToRange(max)
              if(!found) found = cursor.goToLast()
            } else {
              found = cursor.goToLast()
            }
            while((!range.limit || keys.length < range.limit) && found !== null) {
              if(range.gt && found <= range.gt) break;
              if(range.gte && found < range.gte) break;
              if((!range.lt || found < range.lt) && (!range.lte || found <= range.lte)) {
                // key in range, skip keys outside range
                keys.push(found)
                if(keys.length > 4096 && !range.limit) throw new Error("range limit not defined! too big range!")
              }
              found = cursor.goToPrev()
            }
          } else {
            if(min) {
              found = cursor.goToRange(min)
            } else {
              found = cursor.goToFirst()
            }
            while((!range.limit || keys.length < range.limit) && found !== null) {
              if(range.lt && found >= range.lt) break;
              if(range.lte && found > range.lte) break;
              if((!range.gt || found > range.gt) && (!range.gte || found >= range.gte)) {
                // key in range, skip keys outside range
                keys.push(found)
                if(keys.length > 4096 && !range.limit) throw new Error("range limit not defined! too big range!")                  
              }
              //console.log("    GO TO NEXT [")
              found = cursor.goToNext()
              //console.log("    ] GO TO NEXT")
            }
          }
        } finally {
          cursor.close()
        }
       // console.log("  ] FETCH KEYS")

        //console.log("  FETCH DATA [")
        data = new Array(keys.length)
        for(let i = 0; i < keys.length; i++) {
          const key = keys[i]
          const json = txn.getString(this.lmdb, key)
          try {
            const obj = this.serialization.parse(json)
            //obj.id = found
            data[i] = obj
          } catch(e) {
            return reject(e)
          }
        }
        //console.log("  ] FETCH DATA")
      } finally {
        txn.commit()
        //console.log("] TXN")
      }
      resolve(data)
      })
    })
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
    return new Promise((resolve, reject) => {
      withLmdbNative({ op: 'rangeDelete', store: this.name, range, keysOnly }, () => {
      let keys = []
      let count, last
      let found
      //console.log("TXN [")
      const txn = this.env.beginTxn()
      try {
        //console.log("  FETCH KEYS [")
        let cursor = new lmdb.Cursor(txn, this.lmdb)
        try {
          const min = range.gt || range.gte
          const max = range.lt || range.lte
          if(range.reverse) {
            if(max) {
              found = cursor.goToRange(max)
              if(!found) found = cursor.goToLast()
            } else {
              found = cursor.goToLast()
            }
            while((!range.limit || keys.length < range.limit) && found !== null) {
              if(range.gt && found <= range.gt) break;
              if(range.gte && found < range.gte) break;
              if((!range.lt || found < range.lt) && (!range.lte || found <= range.lte)) {
                // key in range, skip keys outside range
                keys.push(found)
                if(keys.length > 4096 && !range.limit) throw new Error("range limit not defined! too big range!")  
              }
              found = cursor.goToPrev()
            }
          } else {
            if(min) {
              found = cursor.goToRange(min)
            } else {
              found = cursor.goToFirst()
            }
            while((!range.limit || keys.length < range.limit) && found !== null) {
              if(range.lt && found >= range.lt) break;
              if(range.lte && found > range.lte) break;
              if((!range.gt || found > range.gt) && (!range.gte || found >= range.gte)) {
                // key in range, skip keys outside range
                keys.push(found)
                if(keys.length > 4096 && !range.limit) throw new Error("range limit not defined! too big range!")  
              }
              //console.log("    GO TO NEXT [")
              found = cursor.goToNext()
              //console.log("    ] GO TO NEXT")
            }
          }
        } finally {
          cursor.close()
        }
        // console.log("  ] FETCH KEYS")

        count = keys.length
        last = keys[keys.length - 1]
        //console.log("  DELETE DATA [")
        for(let i = 0; i < keys.length; i++) {
          const key = keys[i]
          try {
            let obj = null
            if(!keysOnly) {
              const json = txn.getString(this.lmdb, key)
              obj = this.serialization.parse(json)
            }
            txn.del(this.lmdb, key)
            const objectObservable = this.objectObservables.get(key)
            if(objectObservable) objectObservable.set(null)
            const rangeObservables = this.rangeObservablesTree.search([key, key])
            for (const rangeObservable of rangeObservables) {
              rangeObservable.deleteObject(obj || { id: key })
            }
          } catch(e) {
            return reject(e)
          }
        }
        //console.log("  ] DELETE DATA")
      } finally {
        txn.commit()
        //console.log("] TXN")
      }
      resolve({ count, last })
      })
    })
  }

  async countGet(range) {
    if(!range) throw new Error("range not defined")
    return new Promise((resolve, reject) => {
      withLmdbNative({ op: 'countGet', store: this.name, range }, () => {
      let found
      let count = 0
      //console.log("TXN [")
      const txn = this.env.beginTxn()
      try {
        //console.log("  COUNT KEYS [")
        let cursor = new lmdb.Cursor(txn, this.lmdb)
        try {
          const min = range.gt || range.gte
          const max = range.lt || range.lte
          if(range.reverse) {
            if(max) {
              found = cursor.goToRange(max)
              if(!found) found = cursor.goToLast()
            } else {
              found = cursor.goToLast()
            }
            while((!range.limit || count < range.limit) && found !== null) {
              if(range.gt && found <= range.gt) break;
              if(range.gte && found < range.gte) break;
              if((!range.lt || found < range.lt) && (!range.lte || found <= range.lte)) {
                // key in range, skip keys outside range
                count ++
                if(count > 4096 && !range.limit) throw new Error("range limit not defined! too big range!")
              }
              found = cursor.goToPrev()
            }
          } else {
            if(min) {
              found = cursor.goToRange(min)
            } else {
              found = cursor.goToFirst()
            }
            while((!range.limit || count < range.limit) && found !== null) {
              if(range.lt && found >= range.lt) break;
              if(range.lte && found > range.lte) break;
              if((!range.gt || found > range.gt) && (!range.gte || found >= range.gte)) {
                // key in range, skip keys outside range
                count++
                if(count > 4096 && !range.limit) throw new Error("range limit not defined! too big range!")
              }
              //console.log("    GO TO NEXT [")
              found = cursor.goToNext()
              //console.log("    ] GO TO NEXT")
            }
          }
        } finally {
          cursor.close()
        }
        // console.log("  ] COUNT KEYS")

      } finally {
        txn.commit()
        //console.log("] TXN")
      }
      resolve(count)
      })
    })
  }

  countObservable(range) {
    let observable = this.countObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new CountObservable(this, range)
    return observable
  }

  async put(object) {
    const id = object.id
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    if(!id) throw new Error("ID must not be empty string!")
    const profile = debugPut.enabled
    if(profile) logEnvOnce(this.env, this.name)
    const t0 = profile ? performance.now() : 0
    let oldObject = null
    let oldBytes = 0
    let newBytes = 0
    const tBegin = profile ? performance.now() : 0
    let tTxn = tBegin
    let tGet = tBegin
    let tParse = tBegin
    let tStr = tBegin
    let tPut = tBegin
    withLmdbNative({ op: 'put', store: this.name, id }, () => {
    const txn = this.env.beginTxn()
    tTxn = profile ? performance.now() : 0
    tGet = tTxn
    tParse = tTxn
    tStr = tTxn
    tPut = tTxn
    try {
      const json = txn.getString(this.lmdb, id)
      tGet = profile ? performance.now() : 0
      oldBytes = profile && json ? json.length : 0
      oldObject = json ? this.serialization.parse(json) : null
      tParse = profile ? performance.now() : 0
      const encoded = this.serialization.stringify(object)
      newBytes = profile ? encoded.length : 0
      tStr = profile ? performance.now() : 0
      txn.putString(this.lmdb, id, encoded, { noOverwrite: false })
      tPut = profile ? performance.now() : 0
    } catch(err) {
      console.log("ERROR WHILE PUTTING OBJECT", id)
      console.error(err)
      console.log("OBJECT DATA",  JSON.stringify(object))
      process.exit(1)
      throw err
    } finally {
      txn.commit()
    }
    })
    const tCommit = profile ? performance.now() : 0
    const objectObservable = this.objectObservables.get(id)
    if (objectObservable) objectObservable.set(object, oldObject)
    const rangeObservables = this.rangeObservablesTree.search([id, id])
    for(const rangeObservable of rangeObservables) {
      if(rangeObservable.rangeDescr[0] > id || rangeObservable.rangeDescr[1] < id) {
        console.error("TREE LEAKING", "ID", id, "IS OUT OF", rangeObservable.rangeDescr)
        continue
      }
      rangeObservable.putObject(object, oldObject)
    }
    if(profile) {
      const tEnd = performance.now()
      debugPut(
        'store.put name=%s id=%s oldBytes=%d newBytes=%d beginTxn=%sms getString=%sms parse=%sms stringify=%sms putString=%sms commit=%sms notify=%sms total=%sms observables={object:%d range:%d count:%d rangeHits:%d objectHit:%s}',
        this.name || '?',
        id,
        oldBytes,
        newBytes,
        (tTxn - tBegin).toFixed(1),
        (tGet - tTxn).toFixed(1),
        (tParse - tGet).toFixed(1),
        (tStr - tParse).toFixed(1),
        (tPut - tStr).toFixed(1),
        (tCommit - tPut).toFixed(1),
        (tEnd - tCommit).toFixed(1),
        (tEnd - t0).toFixed(1),
        this.objectObservables.size,
        this.rangeObservables.size,
        this.countObservables.size,
        rangeObservables.length,
        !!objectObservable
      )
    }
    return oldObject
  }

  async delete(id) {
    return withLmdbNative({ op: 'delete', store: this.name, id }, () => {
    const txn = this.env.beginTxn()
    let object = null
    try {
      const json = txn.getString(this.lmdb, id)
      object = json ? JSON.parse(json) : null
      txn.del(this.lmdb, id)
    } catch(e) {
      //console.error("FAILED REMOVE OF", id)
      //console.trace("FAILED REMOVE")
    } finally {
      txn.commit()
    }
    const objectObservable = this.objectObservables.get(id)
    if(objectObservable) objectObservable.set(null)
    const rangeObservables = this.rangeObservablesTree.search([id, id])
    for(const rangeObservable of rangeObservables) {
      rangeObservable.deleteObject(object || { id })
    }
    return object
    })
  }

  stat() {
    return withLmdbNative({ op: 'stat', store: this.name }, () => {
    const txn = this.env.beginTxn({ readOnly: true })
    try {
      const s = this.lmdb.stat(txn)
      const pages = s.treeBranchPageCount + s.treeLeafPageCount + s.overflowPages
      return {
        available: true,
        entryCount: s.entryCount,
        pageSize: s.pageSize,
        treeDepth: s.treeDepth,
        branchPages: s.treeBranchPageCount,
        leafPages: s.treeLeafPageCount,
        overflowPages: s.overflowPages,
        usedBytes: pages * s.pageSize
      }
    } finally {
      txn.abort()
    }
    })
  }

}

export default Store
