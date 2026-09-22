import IntervalTreeLib from '@live-change/flatten-interval-tree'
const IntervalTree = IntervalTreeLib.default ?? IntervalTreeLib
import ReactiveDao from "@live-change/dao"
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'

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
    if(this.range.gt && !(id > this.range.gt)) return
    if(this.range.lt && !(id < this.range.lt)) return
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
    this.store.rangeObservablesTree.insert(treeInsert, this)
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

async function handleRequest(request, onUpgrade = ()=>{}) {
  return new Promise((resolve, reject) => {
    request.onerror = (event) => {
      reject(request.error)
    }
    request.onsuccess = (event) => {
      resolve(request.result)
    }
    request.onupgradeneeded = onUpgrade
  })
}

class Store {
  constructor(dbName, storeName, options = {}) {
    if(!dbName) throw new Error("dbName argument is required")
    if(!storeName) throw new Error("storeName argument is required")

    this.dbName = dbName
    this.storeName = storeName
    this.idbName = dbName + '.' + storeName

    if(options.noSerialization) {
      this.serialization = {
        stringify: x => x,
        parse: x => x
      }
    } else {
      const serialization = options.serialization ?? JSON
      this.serialization = {
        stringify: x => x ? ({ id: x.id, data: serialization.stringify(x) }) : null,
        parse: x => x?.data ? serialization.parse(x.data) : null
      }
    }

    this.finished = false

    this.db = null
    this.dbPromise = null
    this.channel = null

    this.openPromise = null

    this.objectObservables = new Map()
    this.rangeObservables = new Map()
    this.countObservables = new Map()
    this.rangeObservablesTree = new IntervalTree()
  }

  clear() {
    globalThis.indexedDB.deleteDatabase(this.idbName)
  }

  async openDb() {
    console.log("Opening db", this.dbName, this.storeName)
    const openRequest = globalThis.indexedDB.open(this.idbName, 1)
    //globalThis.lastOpenRequest = openRequest
    this.dbPromise = handleRequest(openRequest, (event) => {
      //console.error("Upgrading db", this.dbName, this.storeName)
      const db = event.target.result
      const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
    })
    this.db = await this.dbPromise
    this.db.addEventListener("close", (event) => {
      console.log("database close event", this.idbName)
      this.openDb()
    })
    console.log("Opened db", this.dbName, this.storeName)
  }
  async openChannel() {
    this.channel = new BroadcastChannel('lc-db-channel' + this.dbName + '-' + this.storeName, {
      idb: {
        onclose: () => {
          if(this.finished) return
          this.channel.close()
          this.openChannel()
        }
      }
    })
    this.channel.onmessage = message => this.handleChannelMessage(message)
  }
  async open() {
    await this.openChannel()
    await this.openDb()
  }
  async close() {
    this.finished = true
    await this.channel.close()
    ;(await this.dbPromise).close()
  }
  async ensureOpen() {
    if(!this.openPromise) this.openPromise = this.open()
    await this.openPromise
  }

  async deleteDb() {
    ;(await this.dbPromise).deleteObjectStore(this.storeName)
    if(!this.finished) await this.close()
  }

  async handleChannelMessage(message) {
    console.log("CHANNEL MESSAGE", message)
    switch(message.type) {
      case 'put' : {
        const { object: objectJson, oldObjectJson } = message
        const object = this.serialization.parse(objectJson)
        const oldObject = this.serialization.parse(oldObjectJson)
        const id = object?.id || oldObject?.id
        if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
        const objectObservable = this.objectObservables.get(id)
        if(objectObservable) objectObservable.set(object, oldObject)
        const rangeObservables = this.rangeObservablesTree.search([id, id])
        for(const rangeObservable of rangeObservables) {
          rangeObservable.putObject(object, oldObject)
        }
      } break
      case 'delete' : {
        const { object: objectJson } = message
        const object = this.serialization.parse(objectJson)
        const id = object?.id
        if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
        const objectObservable = this.objectObservables.get(id)
        if(objectObservable) objectObservable.set(null)
        const rangeObservables = this.rangeObservablesTree.search([id, id])
        for(const rangeObservable of rangeObservables) {
          rangeObservable.deleteObject(object)
        }
      } break
      default:
        throw new Error("unknown message type " + message.type + ' in message ' + JSON.stringify(message))
    }
  }

  async objectGet(id) {
    await this.ensureOpen()
    if(!id) throw new Error("key is required")
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    const transaction = this.db.transaction([this.storeName], 'readonly')
    const store = transaction.objectStore(this.storeName)
    const json = await handleRequest(store.get(id) || null)
    return json ? this.serialization.parse(json) : null
  }

  objectObservable(key) {
    let observable = this.objectObservables.get(key)
    if(observable) return observable
    observable = new ObjectObservable(this, key)
    return observable
  }

  async rangeGet(range) {
    if(!range) throw new Error("range not defined")
    await this.ensureOpen()
    let data = []
    const min = range.gt || range.gte
    const max = range.lt || range.lte
    let keyRange = undefined
    if(min && max) {
      keyRange = IDBKeyRange.bound(min, max, !!range.gt, !!range.lt)
    } else if(min) {
      keyRange = IDBKeyRange.lowerBound(min, !!range.gt)
    } else if(max) {
      keyRange = IDBKeyRange.upperBound(max, !!range.gt)
    }

    const txn = this.db.transaction([this.storeName], 'readonly')
    const store = txn.objectStore(this.storeName)
    if(range.reverse) {
      await new Promise((resolve, reject) => {
        const cursorRequest = store.openCursor(keyRange, 'prev')
        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result
          if ((!range.limit || data.length < range.limit) && cursor) {
            if (range.gt && cursor.key <= range.gt) return resolve()
            if (range.gte && cursor.key < range.gte) return resolve()
            if ((!range.lt || cursor.key < range.lt) && (!range.lte || cursor.key <= range.lte)) {
              const json = cursor.value
              data.push(this.serialization.parse(json))
            }
            cursor.continue()
          } else {
            return resolve()
          }
        }
        cursorRequest.onerror = (event) => {
          reject(event.target.error)
        }
      })
    } else {
      await new Promise((resolve, reject) => {
        const cursorRequest = store.openCursor(keyRange, 'next')
        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result
          if ((!range.limit || data.length < range.limit) && cursor) {
            if(range.lt && cursor.key >= range.lt) return resolve()
            if(range.lte && cursor.key > range.lte) return resolve()
            if((!range.gt || cursor.key > range.gt) && (!range.gte || cursor.key >= range.gte)) {
              const json = cursor.value
              data.push(this.serialization.parse(json))
            }
            cursor.continue()
          } else {
            return resolve()
          }
        }
        cursorRequest.onerror = (event) => {
          reject(event.target.error)
        }
      })
    }
    return data
  }

  rangeObservable(range) {
    let observable = this.rangeObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new RangeObservable(this, range)
    return observable
  }

  async countGet(range) {
    if(!range) throw new Error("range not defined")
    await this.ensureOpen()
    const min = range.gt || range.gte
    const max = range.lt || range.lte
    let keyRange = undefined
    if(min && max) {
      keyRange = IDBKeyRange.bound(min, max, !!range.gt, !!range.lt)
    } else if(min) {
      keyRange = IDBKeyRange.lowerBound(min, !!range.gt)
    } else if(max) {
      keyRange = IDBKeyRange.upperBound(min, !!range.gt)
    }
    const txn = this.db.transaction([this.storeName], 'readonly')
    const store = txn.objectStore(this.storeName)
    const count = await handleRequest(store.count(keyRange))
    if(range.limit && count > range.limit) return range.limit
    return count
  }

  countObservable(range) {
    let observable = this.countObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new CountObservable(this, range)
    return observable
  }

  async rangeDelete(range) {
    if(!range) throw new Error("range not defined")
    await this.ensureOpen()

    let count = 0, last
    const min = range.gt || range.gte
    const max = range.lt || range.lte
    let keyRange = undefined
    if(min && max) {
      keyRange = IDBKeyRange.bound(min, max, !!range.gt, !!range.lt)
    } else if(min) {
      keyRange = IDBKeyRange.lowerBound(min, !!range.gt)
    } else if(max) {
      keyRange = IDBKeyRange.upperBound(min, !!range.gt)
    }

    const txn = this.db.transaction([this.storeName], 'readonly')
    const store = txn.objectStore(this.storeName)
    if(range.reverse) {
      await new Promise((resolve, reject) => {
        const cursorRequest = store.openCursor(keyRange, 'prev')
        cursorRequest.onsuccess = async (event) => {
          const cursor = event.target.result
          if ((!range.limit || count < range.limit) && cursor) {
            if (range.gt && cursor.key <= range.gt) return resolve()
            if (range.gte && cursor.key < range.gte) return resolve()
            if ((!range.lt || cursor.key < range.lt) && (!range.lte || cursor.key <= range.lte)) {
              count++
              const id = cursor.key
              const json = cursor.value
              let object = this.serialization.parse(json)
              last = id
              await handleRequest(cursor.delete())

              if(!object || !object.id) object = { id }

              const objectObservable = this.objectObservables.get(id)
              if(objectObservable) objectObservable.set(null)
              const rangeObservables = this.rangeObservablesTree.search([id, id])
              for(const rangeObservable of rangeObservables) {
                rangeObservable.deleteObject(object)
              }
              this.channel.postMessage({ type: "delete", object: this.serialization.stringify(object) })
            }
            cursor.continue()
          } else {
            return resolve()
          }
        }
        cursorRequest.onerror = (event) => {
          reject(event.target.error)
        }
      })
    } else {
      await new Promise((resolve, reject) => {
        const cursorRequest = store.openCursor(keyRange, 'next')
        cursorRequest.onsuccess = async (event) => {
          const cursor = event.target.result
          if ((!range.limit || count < range.limit) && cursor) {
            if(range.lt && cursor.key >= range.lt) return resolve()
            if(range.lte && cursor.key > range.lte) return resolve()
            if((!range.gt || cursor.key > range.gt) && (!range.gte || cursor.key >= range.gte)) {
              count++
              const id = cursor.key
              const json = cursor.value
              let object = this.serialization.parse(json)
              last = id
              await handleRequest(cursor.delete())

              if(!object || !object.id) object = { id }

              const objectObservable = this.objectObservables.get(id)
              if(objectObservable) objectObservable.set(null)
              const rangeObservables = this.rangeObservablesTree.search([id, id])
              for(const rangeObservable of rangeObservables) {
                rangeObservable.deleteObject(object)
              }
              this.channel.postMessage({ type: "delete", object: this.serialization.stringify(object) })
            }
            cursor.continue()
          } else {
            return resolve()
          }
        }
        cursorRequest.onerror = (event) => {
          reject(event.target.error)
        }
      })
    }
    return { count, last }
  }

  async put(object) {
    const id = object.id
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    await this.ensureOpen()
    //console.error("put", id, object, 'in', this.storeName)
    //console.error("storeNames", this.db.objectStoreNames)
    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    const oldObjectJson = await handleRequest(store.get(id))
    const oldObject = oldObjectJson ? this.serialization.parse(oldObjectJson) : null
    //console.log("PUT", object)
    const json = this.serialization.stringify(object)
    await handleRequest(store.put(json))
    const objectObservable = this.objectObservables.get(id)
    if(objectObservable) objectObservable.set(object, oldObject)
    const rangeObservables = this.rangeObservablesTree.search([id, id])
    for(const rangeObservable of rangeObservables) {
      rangeObservable.putObject(object, oldObject)
    }
    this.channel.postMessage({ type: "put",
      object: this.serialization.stringify(object),
      oldObject: this.serialization.stringify(oldObject)
    })
    return oldObject
  }

  async delete(id) {
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    await this.ensureOpen()

    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)

    const json = await handleRequest(store.get(id))
    const object = json ? this.serialization.parse(json) : null
    await handleRequest(store.delete(id))
    const objectObservable = this.objectObservables.get(id)
    if(objectObservable) objectObservable.set(null)
    const rangeObservables = this.rangeObservablesTree.search([id, id])
    for(const rangeObservable of rangeObservables) {
      rangeObservable.deleteObject(object)
    }
    if(object) this.channel.postMessage({ type: "delete", object: this.serialization.stringify(object)  })
    return object
  }

  stat() {
    return {
      available: false,
      entryCount: null,
      usedBytes: null
    }
  }

}

export default Store
