import Debug from 'debug'
const debugPut = Debug('db:profilePut')

class OpLogger {
  constructor(store, ...outputs) {
    this.store = store
    this.outputs = outputs
  }

  objectGet(key) {
    return this.store.objectGet(key)
  }

  objectObservable(key) {
    return this.store.objectObservable(key)
  }

  rangeGet(range) {
    return this.store.rangeGet(range)
  }

  rangeObservable(range) {
    return this.store.rangeObservable(range)
  }

  firstId() {
    return this.store.firstId()
  }
  lastId() {
    return this.store.lastId()
  }

  async put(object) {
    if(typeof object.id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    const profile = debugPut.enabled
    const t0 = profile ? performance.now() : 0
    let res = await this.store.put(object)
    const tStore = profile ? performance.now() : 0
    const same = JSON.stringify(object) === JSON.stringify(res)
    const tCmp = profile ? performance.now() : 0
    if(same) {
      if(profile) {
        debugPut(
          'opLogger.put skipOplog store=%s id=%s storePut=%sms stringifyCompare=%sms total=%sms',
          this.store.name || '?',
          object.id,
          (tStore - t0).toFixed(1),
          (tCmp - tStore).toFixed(1),
          (tCmp - t0).toFixed(1)
        )
      }
      return res
    }
    for(let output of this.outputs) await output({ type: 'put', object, oldObject: res })
    if(profile) {
      const tOut = performance.now()
      debugPut(
        'opLogger.put store=%s id=%s storePut=%sms stringifyCompare=%sms oplogWrite=%sms total=%sms outputs=%d',
        this.store.name || '?',
        object.id,
        (tStore - t0).toFixed(1),
        (tCmp - tStore).toFixed(1),
        (tOut - tCmp).toFixed(1),
        (tOut - t0).toFixed(1),
        this.outputs.length
      )
    }
    return res
  }

  async delete(id) {
    let object = await this.store.delete(id)
    if(object) {
      for(let output of this.outputs) await output({ type: 'delete', object })
    }
    return object
  }

}

export default OpLogger