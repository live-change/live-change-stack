class ChangeStream {
  constructor() {
  }
  onChange() {
    throw new Error("abstract method - not implemented")
  }
  async rangeGet(range) {
    throw new Error("abstract method - not implemented")
  }
  range(range) {
    throw new Error("abstract method - not implemented")
  }
  async objectGet(id) {
    throw new Error("abstract method - not implemented")
  }
  object(id) {
    throw new Error("abstract method - not implemented")
  }
  async count(range = {}) {
    throw new Error("abstract method - not implemented")
  }
  async to(output) {
    return this.onChange(async (obj, oldObj, id, timestamp) => {
      if(obj || oldObj) await output.change(obj, oldObj, id, timestamp)
    })
    await this.observerPromise
  }  
  filter(func) {
    const pipe = new ChangeStreamPipe()
    const observerPromise = this.onChange(async (obj, oldObj, id, timestamp) => {
      const newObj = obj && await func(obj)
      const newOldObj = oldObj && await func(oldObj)
      if(!(newObj || newOldObj)) return
      pipe.change(newObj, newOldObj, id, timestamp)
    })
    pipe.master = this
    pipe.observerPromise = observerPromise
    return pipe
  }
  map(func) {
    const pipe = new ChangeStreamPipe()
    const observerPromise = this.onChange(async (obj, oldObj, id, timestamp) => {
      const newObj = obj && await func(obj)
      const newOldObj = oldObj && await func(oldObj)
      if(!(newObj || newOldObj)) return
      pipe.change(newObj, newOldObj, id, timestamp)
    })
    pipe.master = this
    pipe.observerPromise = observerPromise
    return pipe
  }
  indexBy(func) {
    const pipe = new ChangeStreamPipe()
    const observerPromise = this.onChange((obj, oldObj, id, timestamp) => {
      const indList = obj && func(obj)
      const oldIndList = oldObj && func(oldObj)
      const ind = indList && indList.map(v => JSON.stringify(v)).join(':')+'_'+id
      const oldInd = oldIndList && oldIndList.map(v => JSON.stringify(v)).join(':')+'_'+id
      if(ind === oldInd) return // no index change, ignore
      if(ind) {
        pipe.change({ id: ind, to: id }, null, ind, timestamp)
      }
      if(oldInd) {
        pipe.change(null, { id: oldInd, to: id }, oldInd, timestamp)
      }
    })
    pipe.master = this
    pipe.observerPromise = observerPromise
    return pipe
  }
  async readInBuckets(bucketCallback, bucketSize = 128) {
    let position = ''
    let readed = 0
    do {
      const bucket = await this.rangeGet({ gt: position, limit: bucketSize })
      readed = bucket.length
      if(!bucket.length) break
      position = bucket[bucket.length - 1].id
      await bucketCallback(bucket)
    } while(readed === bucketSize)
  }
  cross(other, selfToRange, otherToRange, bucketSize = 128) { 
    const pipe = new ChangeStreamPipe()
    const observerPromise = this.onChange(async (obj, oldObj, id, timestamp) => {     
      const otherRange = await selfToRange(obj || oldObj)
      if(!otherRange) return // ignore
      if(typeof otherRange === 'string') { // single id
        const otherObj = await other.objectGet(otherRange)
        await pipe.change([obj, otherObj], [oldObj, otherObj], [id, otherRange], timestamp)
        return
      }
      await other.range(otherRange).readInBuckets(async bucket => {
        for(const otherObj of bucket) {
          const otherId = otherObj.id
          await pipe.change([obj, otherObj], [oldObj, otherObj], [id, otherId], timestamp)
        }
      }, bucketSize)
    })
    const otherObserverPromise = other.onChange(async (otherObj, oldOtherObj, id, timestamp) => {
      const selfRange = await otherToRange(otherObj || oldOtherObj)      
      if(!selfRange) return // ignore
      const otherId = id
      if(typeof selfRange === 'string') { // single id
        const obj = await this.objectGet(selfRange)
        await pipe.change([obj, otherObj], [obj, oldOtherObj], [selfRange, otherId], timestamp)
        return
      }
      await this.range(selfRange).readInBuckets(async bucket => {
        for(const obj of bucket) {
          const id = obj.id
          await pipe.change([obj, otherObj], [obj, oldOtherObj], [id, otherId], timestamp)
        }
      }, bucketSize)    
    })
    pipe.master = this
    pipe.observerPromise = Promise.all([observerPromise, otherObserverPromise])
    return pipe
  }
  groupExisting(objectToRange) {
    const pipe = new ChangeStreamPipe()
    const observerPromise = this.onChange(async (obj, oldObj, id, timestamp) => {
      const existingObj = obj || oldObj
      let range = await objectToRange(existingObj)
      if(!range) return
      if(typeof range === 'string') {
        range = { gte: range, lte: range + '\xFF\xFF\xFF\xFF' }
      }
      const count = await this.count(range)
      if(count) {
        await pipe.change(existingObj, null, id, timestamp)        
      } else {
        await pipe.change(null, existingObj, id, timestamp)
      }
    })
    pipe.master = this
    pipe.observerPromise = observerPromise
    return pipe
  }
}

class ChangeStreamPipe extends ChangeStream {
  constructor() {
    super()
    this.callbacks = []
  }
  onChange(cb) {
    this.callbacks.push(cb)
    return cb
  }
  async unobserve(cb) {
    const cbIndex = this.callbacks.indexOf(cb)
    if(cbIndex === -1) throw new Error("observer not found")
    if(this.callbacks.length === 0) {
      this.master.unobservePromise = await this.observerPromise
    }
  }
  async change(obj, oldObj, id, timestamp) {
    for(const callback of this.callbacks) await callback(obj, oldObj, id, timestamp)
  }
}

export { ChangeStream, ChangeStreamPipe }