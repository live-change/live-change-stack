import IntervalTreeLib from '@live-change/flatten-interval-tree'
const IntervalTree = IntervalTreeLib.default ?? IntervalTreeLib
import ReactiveDao from "@live-change/dao"
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'
import * as storage from './storage.js'

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

class Store {
  constructor(dbName, storeName, type, options = {}) {
    if(!dbName) throw new Error("dbName argument is required")
    if(!storeName) throw new Error("storeName argument is required")
    if(!type) throw new Error("type argument is required")

    this.dbName = dbName
    this.storeName = storeName

    const {
      serialization = JSON
    } = options
    this.serialization = serialization

    this.prefix = `lcdb/${dbName}/${storeName}/`

    this.finished = false

    this.storage = storage[type]
    if(!this.storage) throw new Error("Unknown storage type: " + type)

    this.channel = null

    this.objectObservables = new Map()
    this.rangeObservables = new Map()
    this.rangeObservablesTree = new IntervalTree()
  }

  clear() {
    return this.storage.clear()
  }

  async openChannel() {
    this.channel = new BroadcastChannel(`lc-db-${this.dbName}-${this.storeName}`, {
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
  }
  async close() {
    this.finished = true
    await this.channel.close()
  }

  async deleteDb() {
    if(!this.finished) await this.close()
    const all = await this.storage.getKeys()
    const own = all.filter(key => key.startsWith(this.prefix))
    await this.storage.remove(own)
  }

  async handleChannelMessage(message) {
    console.log("handleChannelMessage", message)
    switch(message.type) {
      case 'put' : {
        const { object, oldObject } = message
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
        const { object } = message
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
    if(!id) throw new Error("key is required")
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    return this.serialization.parse(await this.storage.getItem(this.prefix + id) || 'null')
  }

  objectObservable(key) {
    let observable = this.objectObservables.get(key)
    if(observable) return observable
    observable = new ObjectObservable(this, key)
    return observable
  }

  async rangeGet(range) {
    if(!range) throw new Error("range not defined")
    const { gt, gte, lt, lte, limit, reverse } = range
    const all = (await this.storage.getKeys())
      .filter(key => key.startsWith(this.prefix))
      .sort()
    if(range.reverse) all.reverse()
    const keys = all.filter(key => {
      const id = key.slice(this.prefix.length)
      if(gt && !(id > gt)) return false
      if(gte && !(id >= gte)) return false
      if(lt && !(id < lt)) return false
      if(lte && !(id <= lte)) return false
      return true
    }).slice(0, limit)
    const objects = (await this.storage.getValues(keys))
      .map(json => this.serialization.parse(json))
      .sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))
    if(range.reverse) objects.reverse()
    return objects
  }

  rangeObservable(range) {
    let observable = this.rangeObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new RangeObservable(this, range)
    return observable
  }

  async countGet(range) {
    if(!range) throw new Error("range not defined")
    const { gt, gte, lt, lte, limit, reverse } = range
    const all = await this.storage.getKeys()
    const keys = all.filter(key => {
      if(!key.startsWith(this.prefix)) return false
      const id = key.slice(this.prefix.length)
      if(gt && !(id > gt)) return false
      if(gte && !(id >= gte)) return false
      if(lt && !(id < lt)) return false
      if(lte && !(id <= lte)) return false
      return true
    }).slice(0, limit)
    return keys.length
  }

  countObservable(range) {
    let observable = this.countObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new CountObservable(this, range)
    return observable
  }

  async rangeDelete(range) {
    if(!range) throw new Error("range not defined")
    const { gt, gte, lt, lte, limit, reverse } = range
    const all = await this.storage.getKeys()
    const keys = all.filter(key => {
      if(!key.startsWith(this.prefix)) return false
      const id = key.slice(this.prefix.length)
      if(gt && !(id > gt)) return false
      if(gte && !(id >= gte)) return false
      if(lt && !(id < lt)) return false
      if(lte && !(id <= lte)) return false
      return true
    }).slice(0, limit)
    await this.storage.delete(keys)
    return { count: keys.length, last: keys[keys.length - 1] }
  }

  async put(object) {
    const id = object.id
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    const oldObject = this.serialization.parse(await this.storage.getItem(this.prefix + id) || 'null')
    await this.storage.setItem(this.prefix + id, this.serialization.stringify(object))
    const objectObservable = this.objectObservables.get(id)
    if(objectObservable) objectObservable.set(object, oldObject)
    const rangeObservables = this.rangeObservablesTree.search([id, id])
    for(const rangeObservable of rangeObservables) {
      rangeObservable.putObject(object, oldObject)
    }
    this.channel.postMessage({ type: "put", object, oldObject })
    return oldObject
  }

  async delete(id) {
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    const object = this.serialization.parse(await this.storage.getItem(this.prefix + id))
    await this.storage.removeItem(this.prefix + id)
    const objectObservable = this.objectObservables.get(id)
    if(objectObservable) objectObservable.set(null)
    const rangeObservables = this.rangeObservablesTree.search([id, id])
    for(const rangeObservable of rangeObservables) {
      rangeObservable.deleteObject(object)
    }
    this.channel.postMessage({ type: "delete", object  })
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
