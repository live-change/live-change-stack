import AtomicWriter from './AtomicWriter.js'
import ReactiveDao from "@live-change/dao"

class Log {
  constructor(database, name, config) {
    this.database = database
    this.name = name
    this.configObservable = new ReactiveDao.ObservableValue(config)
    this.configObservable.observe(() => {}) // prevent dispose and clear

    this.data = database.store(config.uid + '.log', {...config, ...config.data})

    this.lastTime = Date.now()
    this.lastId = 0
  }

  async put(log) {
    const now = Date.now()
    if(now === this.lastTime) {
      this.lastId ++
    } else {
      this.lastId = 0
      this.lastTime = now
    }
    const id = ((''+this.lastTime).padStart(16, '0'))+':'+((''+this.lastId).padStart(6, '0'))
    await this.data.put({ ...log, id, timestamp: this.lastTime })
    return id
  }

  async putOld(log) {
    await this.data.put(log)
  }

  async clear(before, maxCount = Infinity) {
    let count = 0
    let allCount = 0
    let last = 0
    do {
      const limit = Math.min(4096, maxCount - allCount)
      const result = await this.data.rangeDelete({ lt: before, limit })    
      count = result.count
      last = result.last
      allCount += count
      await new Promise(resolve => setTimeout(resolve, 100))
    } while(count > 0 && allCount < maxCount)
    return { count: allCount, last }
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

  async deleteLog() {
    const config = this.configObservable.value
    await this.database.deleteStore(config.uid + '.log')
  }

}

export default Log
