import IntervalTreeLib from '@live-change/interval-tree'
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
    if(!object) return;
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

}

export default Store
