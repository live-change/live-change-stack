import IntervalTreeLib from '@live-change/flatten-interval-tree'
const IntervalTree = IntervalTreeLib.default ?? IntervalTreeLib
import ReactiveDao from "@live-change/dao"
import createTree from "functional-red-black-tree"

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
    this.set(await this.store.rangeGet(this.range))
  }

  async putObject(object, oldObject) {
    await this.readPromise
    const id = object.id
    if(this.range.gt && !(id > this.range.gt)) return
    if(this.range.lt && !(id < this.range.lt)) return
    if(!this.range.reverse) { /// NOT REVERSED:
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
    } else { /// REVERSED:
      if(this.range.limit && this.list.length == this.range.limit) {
        for(let i = this.list.length - 1; i >= 0; i--) {
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
    const inserted = this.store.rangeObservablesTree.insert(treeInsert, this)
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
  constructor(options = {}) {
    this.tree = createTree()

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
    const json = this.tree.get(key)
    if(!json) return Promise.resolve(null)
    try {
      const obj = this.serialization.parse(json)
      return Promise.resolve(obj)
    } catch(e) {
      return Promise.reject(e)
    }
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
      let data = []
      const min = range.gt || range.gte
      const max = range.lt || range.lte
      let cursor
      if(range.reverse) {
        if(max) {
          cursor = range.lt ? this.tree.lt(max) : this.tree.le(max)
        } else {
          cursor = this.tree.end
        }
        while((!range.limit || data.length < range.limit) && cursor.key !== undefined) {
          if(range.gt && cursor.key <= range.gt) break;
          if(range.gte && cursor.key < range.gte) break;
          if((!range.lt || cursor.key < range.lt) && (!range.lte || cursor.key <= range.lte)) {
            // key in range, skip keys outside range
            data.push(this.serialization.parse(cursor.value))
          }
          cursor.prev()
        }
      } else {
        if(min) {
          cursor = range.gt ? this.tree.gt(min) : this.tree.ge(min)
        } else {
          cursor = this.tree.begin
        }
        while((!range.limit || data.length < range.limit) && cursor.key !== undefined) {
          if(range.lt && cursor.key >= range.lt) break;
          if(range.lte && cursor.key > range.lte) break;
          if((!range.gt || cursor.key > range.gt) && (!range.gte || cursor.key >= range.gte)) {
            // key in range, skip keys outside range
            data.push(this.serialization.parse(cursor.value))
          }
          cursor.next()
        }
      }
      resolve(data)
    })
  }

  rangeObservable(range) {
    let observable = this.rangeObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new RangeObservable(this, range)
    return observable
  }

  countGet(range) {
    if(!range) throw new Error("range not defined")
    return new Promise((resolve, reject) => {
      const min = range.gt || range.gte
      const max = range.lt || range.lte
      let cursor
      let count = 0
      if(range.reverse) {
        if(max) {
          cursor = range.lt ? this.tree.lt(max) : this.tree.le(max)
        } else {
          cursor = this.tree.end
        }
        while((!range.limit || count < range.limit) && cursor.key !== undefined) {
          if(range.gt && cursor.key <= range.gt) break;
          if(range.gte && cursor.key < range.gte) break;
          if((!range.lt || cursor.key < range.lt) && (!range.lte || cursor.key <= range.lte)) {
            // key in range, skip keys outside range
            count++
          }
          cursor.prev()
        }
      } else {
        if(min) {
          cursor = range.gt ? this.tree.gt(min) : this.tree.ge(min)
        } else {
          cursor = this.tree.begin
        }
        while((!range.limit || count < range.limit) && cursor.key !== undefined) {
          if(range.lt && cursor.key >= range.lt) break;
          if(range.lte && cursor.key > range.lte) break;
          if((!range.gt || cursor.key > range.gt) && (!range.gte || cursor.key >= range.gte)) {
            // key in range, skip keys outside range
            count++
          }
          cursor.next()
        }
      }
      resolve(count)
    })
  }

  countObservable(range) {
    let observable = this.countObservables.get(JSON.stringify(range))
    if(observable) return observable
    observable = new CountObservable(this, range)
    return observable
  }

  async rangeDelete(range) {
    if(!range) throw new Error("range not defined")
    return new Promise((resolve, reject) => {
      let keys = []
      let count, last
      let cursor
      const min = range.gt || range.gte
      const max = range.lt || range.lte
      if(range.reverse) {
        if(max) {
          cursor = range.lt ? this.tree.lt(max) : this.tree.le(max)
        } else {
          cursor = this.tree.end
        }
        while((!range.limit || keys.length < range.limit) && cursor.key !== undefined) {
          if(range.gt && cursor.key <= range.gt) break;
          if(range.gte && cursor.key < range.gte) break;
          if((!range.lt || cursor.key < range.lt) && (!range.lte || cursor.key <= range.lte)) {
            // key in range, skip keys outside range
            keys.push(cursor.key)
          }
          cursor.prev()
        }
      } else {
        if(min) {
          cursor = range.gt ? this.tree.gt(min) : this.tree.ge(min)
        } else {
          cursor = this.tree.begin
        }
        while((!range.limit || keys.length < range.limit) && cursor.key !== undefined) {
          if(range.lt && cursor.key >= range.lt) break;
          if(range.lte && cursor.key > range.lte) break;
          if((!range.gt || cursor.key > range.gt) && (!range.gte || cursor.key >= range.gte)) {
            // key in range, skip keys outside range
            keys.push(cursor.key)
          }
          cursor.next()
        }
      }
      count = keys.length
      last = keys[keys.length - 1]
      //console.log("  DELETE DATA [")
      for(let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const json = this.tree.get(key)
        try {
          const obj = this.serialization.parse(json)
          this.tree = this.tree.remove(key)
          const rangeObservables = this.rangeObservablesTree.search([key, key])
          for (const rangeObservable of rangeObservables) {
            rangeObservable.deleteObject(obj)
          }
        } catch(e) {
          return reject(e)
        }
      }
      resolve({ count, last })
    })
  }

  async put(object) {
    const id = object.id
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    if(!id) throw new Error("ID must not be empty string!")
    const oldObjectJson = this.tree.get(id)
    const oldObject = oldObjectJson ? this.serialization.parse(oldObjectJson) : null
    if(oldObjectJson) {
      this.tree = this.tree.remove(id)
    }
    this.tree = this.tree.insert(id, this.serialization.stringify(object))
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
    return oldObject
  }

  async delete(id) {
    let object = null
    try {
      const json = this.tree.get(id)
      object = json ? this.serialization.parse(json) : null
      this.tree = this.tree.remove(id)
    } catch(e) {
     // console.error("FAILED REMOVE OF", id, e)
    } finally {
    }
    const objectObservable = this.objectObservables.get(id)
    if(objectObservable) objectObservable.set(null)
    const rangeObservables = this.rangeObservablesTree.search([id, id])
    for(const rangeObservable of rangeObservables) {
      rangeObservable.deleteObject(object)
    }
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
