const IntervalTree = require('@live-change/interval-tree').default
const ReactiveDao = require("@live-change/dao")
const { BroadcastChannel, createLeaderElection } = require('broadcast-channel')
const idb = require('idb')


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
  constructor(dbName, storeName, options = {}) {
    if(!dbName) throw new Error("dbName argument is required")
    if(!storeName) throw new Error("storeName argument is required")

    this.dbName = dbName
    this.storeName = storeName

    this.serialization = {
      stringify: x => x,
      parse: x => x
    }
    if(options.serialization) {
      this.serialization = {
        stringify: x => ({ id: x.id, data: options.serialization.stringify(x) }),
        parse: x => options.serialization.parse(x.data)
      }
    }

    this.finished = false

    this.db = null
    this.dbPromise = null
    this.channel = null

    this.objectObservables = new Map()
    this.rangeObservables = new Map()
    this.rangeObservablesTree = new IntervalTree()
  }

  async openDb() {
    this.dbPromise = idb.openDB(`lc-db-${this.dbName}-${this.storeName}`, 1, {
      upgrade: (db) => {
        const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
      },
      terminated: async () => {
        console.log("IndexedDB terminated!")
        if(this.finished) return
        for(const [key, value] of this.objectObservables) value.dispose()
        for(const [key, value] of this.rangeObservables) value.dispose()
        await this.openDb()
        for(const [key, value] of this.objectObservables) value.respawn()
        for(const [key, value] of this.rangeObservables) value.respawn()
      }
    })
    this.db = await this.dbPromise
  }
  async openChannel() {
    this.channel = new BroadcastChannel('lc-db-channel' + this.dbName, {
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

  async deleteDb() {
    if(!this.finished) await this.close()
    await idb.deleteDB('lc-db-' + this.dbName)
  }

  async handleChannelMessage(message) {
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
    const json = await this.db.get(this.storeName, id) || null
    return json && this.serialization.parse(json)
  }

  objectObservable(key) {
    let observable = this.objectObservables.get(key)
    if(observable) return observable
    observable = new ObjectObservable(this, key)
    return observable
  }

  async rangeGet(range) {
    if(!range) throw new Error("range not defined")
    console.log("RANGE GET!")

    const txn = this.db.transaction(this.storeName, 'readonly')
    let data = []
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

    if(range.reverse) {
      let cursor = await txn.store.openCursor(keyRange, 'prev')
      while ((!range.limit || data.length < range.limit) && cursor) {
        if (range.gt && cursor.key <= range.gt) break
        if (range.gte && cursor.key < range.gte) break
        if ((!range.lt || cursor.key < range.lt) && (!range.lte || cursor.key <= range.lte)) {
          const json = cursor.value
          data.push(this.serialization.parse(json))
        }
        cursor = await cursor.continue()
      }
    } else {
      let cursor = await txn.store.openCursor(keyRange, 'next')
      //console.log("CURSOR", cursor)
      while((!range.limit || data.length < range.limit) && cursor) {
        if(range.lt && cursor.key >= range.lt) break
        if(range.lte && cursor.key > range.lte) break
        if((!range.gt || cursor.key > range.gt) && (!range.gte || cursor.key >= range.gte)) {
          const json = cursor.value
          data.push(this.serialization.parse(json))
        }
        cursor = await cursor.continue()
        //console.log("CURSOR C", cursor)
      }
      //console.log("CUR READ END", cursor)
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
    const count = await this.count(this.storeName, keyRange)
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

    const txn = this.db.transaction(this.storeName)
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

    if(range.reverse) {
      let cursor = await txn.store.openCursor(keyRange, 'prev')
      while ((!range.limit || data.length < range.limit) && cursor) {
        if (range.gt && cursor.key <= range.gt) break
        if (range.gte && cursor.key < range.gte) break
        if ((!range.lt || cursor.key < range.lt) && (!range.lte || cursor.key <= range.lte)) {
          count++
          const id = cursor.key
          const json = cursor.value
          const object = this.serialization.parse(json)
          last = id
          await cursor.delete()

          const objectObservable = this.objectObservables.get(id)
          if(objectObservable) objectObservable.set(null)
          const rangeObservables = this.rangeObservablesTree.search([id, id])
          for(const rangeObservable of rangeObservables) {
            rangeObservable.deleteObject(object)
          }
          this.channel.postMessage({ type: "delete", object })
        }
        cursor = await cursor.continue()
      }
    } else {
      let cursor = await txn.store.openCursor(keyRange, 'prev')
      while((!range.limit || data.length < range.limit) && cursor) {
        if(range.lt && cursor.key >= range.lt) break
        if(range.lte && cursor.key > range.lte) break
        if((!range.gt || cursor.key > range.gt) && (!range.gte || cursor.key >= range.gte)) {
          count++
          const id = cursor.key
          const json = cursor.value
          const object = this.serialization.parse(json)
          last = id
          await cursor.delete()

          const objectObservable = this.objectObservables.get(id)
          if(objectObservable) objectObservable.set(null)
          const rangeObservables = this.rangeObservablesTree.search([id, id])
          for(const rangeObservable of rangeObservables) {
            rangeObservable.deleteObject(object)
          }
          this.channel.postMessage({ type: "delete", object })
        }
        cursor = await cursor.continue()
      }
    }
    return { count, last }
  }

  async put(object) {
    const id = object.id
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    const oldObjectJson = await this.db.get(this.storeName, id)
    const oldObject = oldObjectJson ? this.serialization.parse(oldObjectJson) : null
    console.log("PUT", object)
    const json = this.serialization.stringify(object)
    await this.db.put(this.storeName, json)
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
    const json = await this.db.get(this.storeName, id)
    const object = json ? this.serialization.parse(json) : null
    await this.db.delete(this.storeName, id)
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

module.exports = Store
