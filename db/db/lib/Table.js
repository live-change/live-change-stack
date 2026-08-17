import OpLogger from './OpLogger.js'
import AtomicWriter from './AtomicWriter.js'
import ReactiveDao from '@live-change/dao'
import { combineStoreStats, readStoreStat } from './storeStats.js'
import { clearOpLogStore, createOpLogWritter } from './clearOpLog.js'

class Table {
  constructor(database, name, config) {
    this.database = database
    this.name = name
    this.configObservable = new ReactiveDao.ObservableValue(config)
    this.configObservable.observe(() => {}) // prevent dispose and clear

    this.data = database.store(config.uid + '.data', { ...config, ...config.data })
    this.opLog = database.store(config.uid + '.opLog', { ...config, ...config.opLog })

    this.opLogWritter = createOpLogWritter(this.opLog)
    this.opLogger = new OpLogger(this.data, this.opLogWritter)

    this.atomicWriter = new AtomicWriter(this.opLogger)

    this.locks = new Map()
  }

  objectGet(key) {
    return this.data.objectGet(key)
  }

  objectObservable(key) {
    return this.data.objectObservable(key)
  }

  rangeGet(range) {
    return this.data.rangeGet(range)
  }

  rangeObservable(range) {
    return this.data.rangeObservable(range)
  }

  countGet(range) {
    return this.data.countGet(range)
  }

  countObservable(range) {
    return this.data.countObservable(range)
  }

  async put(object) {
    const id = object.id
    if(!id) throw new Error(`ID is empty ${JSON.stringify(object)}`)
    try {
      return await this.atomicWriter.put(object)
    } catch(e) {
      console.error("ERROR WHILE PUTTING OBJECT", object.id, "TO TABLE", this.name)
      console.error(e)
      throw e
    }
  }

  delete(id) {
    return this.atomicWriter.delete(id)
  }

  update(id, operations, options) {
    if(typeof id != 'string')
      throw new Error(`ID is not string: ${JSON.stringify(id)} while updating table ` + this.name
        + ' with ops' + JSON.stringify(operations))
    return this.atomicWriter.update(id, operations, options)
  }

  async clearOpLog(lastTimestamp, limit, options = {}) {
    return clearOpLogStore(this.opLog, lastTimestamp, limit, this.opLogWritter, options)
  }

  async deleteOpLog() {
    const config = this.configObservable.value
    this.database.deleteStore(config.uid + '.opLog')
    this.database.stores.delete(config.uid + '.opLog')
    this.opLog = this.database.store(config.uid + '.opLog', { ...config, ...config.opLog })
    this.opLogWritter = createOpLogWritter(this.opLog)
    this.opLogger = new OpLogger(this.data, this.opLogWritter)
    this.atomicWriter = new AtomicWriter(this.opLogger)
  }

  async synchronized(key, code) {
    let promise = this.locks.get(key)
    while(promise) {
      await promise
      promise = this.locks.get(key)
    }
    promise = (async () => {
      let result = await code()
      this.locks.delete(key)
      return result
    })()
    this.locks.set(key, promise)
    return await promise
  }

  async deleteTable() {
    this.atomicWriter.cancel()
    const config = this.configObservable.value
    await this.database.deleteStore(config.uid + '.data')
    await this.database.deleteStore(config.uid + '.opLog')
  }

  storeStats() {
    return combineStoreStats(
      readStoreStat(this.data),
      readStoreStat(this.opLog)
    )
  }
}

export default Table
