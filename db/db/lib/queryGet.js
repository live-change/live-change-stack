import { TableWriter, LogWriter } from './queryUpdate.js'
import { ChangeStream } from './ChangeStream.js'
import { unitRange, rangeIntersection } from './utils.js'
const maxGetLimit = 256

class ObjectReader extends ChangeStream {
  #table = null
  #id = null
  #time = null

  constructor(table, id, time) {
    super()
    this.#table = table
    this.#id = id
    this.#time = time
  }
  async onChange(cb) {
    const now = this.#time()
    await cb(await (await this.#table).objectGet(this.#id), null, this.#id, now)
  }
  unobserve(obs) {}
  async get() {
    return await (await this.#table).objectGet(this.#id)
  }
  async rangeGet(range) {
    return await (await this.#table).rangeGet(rangeIntersection(unitRange(this.#id), range))
  }
  range(range) {
    return new RangeReader(this.#table, rangeIntersection(unitRange(this.#id), range))
  }
  async count(range = {}) {
    return await this.#table.countGet(rangeIntersection(unitRange(this.#id), range))
  }
}

class RangeReader extends ChangeStream {
  #table = null
  #range = null
  #time = null

  constructor(table, range, time) {
    super()
    this.#table = table
    this.#range = range
    this.#time = time
  }
  async onChange(cb) {
    const now = this.#time()
    const objects = await (await this.#table).rangeGet(this.#range)
    await Promise.all(objects.map(object => cb(object, null, object.id, now)))
  }
  unobserve(obs) {}
  onDelete(cb) {}
  async get() {
    return await (await this.#table).rangeGet(this.#range)
  }

  async rangeGet(range) {
    return await (await this.#table).rangeGet(rangeIntersection(this.#range, range))
  }
  range(range) {
    return new RangeReader(this.#table, rangeIntersection(this.#range, range), this.#time)
  }
  object(id) {
    return new ObjectReader(this.#table, id, this.#time)
  }
  async objectGet(id) {
    return await (await this.#table).objectGet(id)
  }
  async count(range = {}) {
    return await this.#table.countGet(rangeIntersection(this.#range, range))
  }
}

class TableReader extends ChangeStream {
  #table = null
  #time = null

  constructor(table, time) {
    super()
    this.#table = table
    this.#time = time
  }
  async onChange(cb) {
    let results = []
    let objects = []
    let range = { limit: maxGetLimit }
    while(true) {
      objects = await (await this.#table).rangeGet(range)
      results = results.concat(await Promise.all(objects.map(object => cb(object, null, object.id, this.#time()))))
      if(objects.length === maxGetLimit)  {
        range.gt = objects[objects.length - 1].id
        console.log("READING", this.#table.name, "MORE", range)
      } else {
        break // all processed
      }
    }
    return results
  }
  unobserve(obs) {}
  async rangeGet(range) {
    return new RangeReader(this.#table, range, this.#time)
  }
  range(range) {
    return new RangeReader(this.#table, range, this.#time)
  }
  object(id) {
    return new ObjectReader(this.#table, id, this.#time)
  }
  async objectGet(id) {
    return await (await this.#table).objectGet(id)
  }
  async count(range = {}) {
    return await (await this.#table).countGet(range)
  }
}

class QueryReader {
  #database = null
  #time = null
  #onNewSource = null

  constructor(database, time = () => (''+Date.now()).padStart(16, '0'), onNewSource) {
    this.#database = database
    this.#time = time
    this.#onNewSource = onNewSource
  }
  table(name) {
    if(this.#onNewSource) this.#onNewSource('table', name)
    return new TableReader(this.#database.table(name), this.#time)
  }
  index(name) {
    if(this.#onNewSource) this.#onNewSource('index', name)
    return new TableReader(this.#database.index(name), this.#time)
  }
  log(name) {
    if(this.#onNewSource) this.#onNewSource('log', name)
    return new TableReader(this.#database.log(name), this.#time)
  }
}

class QueryWriter {
  #database = null
  #results = new Map()
  #locks = new Map()
  #canUpdate = false
  #reverse = false

  constructor(database, canUpdate) {
    this.#database = database
    this.#canUpdate = canUpdate
  }
  setReverse(reverse) {
    this.#reverse = reverse
  }
  put(object) {
    this.#results.set(object.id, object)
  }
  delete(object) {
    this.#results.delete(object.id)
  }
  change(obj, oldObj) {
    if(oldObj) return this.delete(oldObj)
    if(obj) return this.put(obj)
  }
  get(id) {
    return this.#results.get(id)
  }
  table(name) {
    if(!this.#canUpdate) throw new Error("Can't update table in read query")
    return new TableWriter(this.#database.table(name))
  }
  log(name) {
    if(!this.#canUpdate) throw new Error("Can't update log in read query")
    return new LogWriter(this.#database.log(name))
  }
  getResults() {
    return Array.from(this.#results.entries())
        .sort(this.#reverse
            ? (a,b) => a[0] > b[0] ? -1 : ( a[0] < b[0] ? 1 : 0)
            : (a,b) => a[0] > b[0] ? 1 : ( a[0] < b[0] ? -1 : 0) )
        .map(a => a[1])
  }
  async synchronized(key, code) {
    let promise = this.#locks.get(key)
    while(promise) {
      await promise
      promise = this.#locks.get(key)
    }
    promise = (async () => {
      let result = await code()
      this.#locks.delete(key)
      return result
    })()
    this.#locks.set(key, promise)
    return await promise
  }
  timeout(date, callback) {
    /// ignore
    return () => {}
  }
  debug(...args) {
    console.log('QUERY DEBUG', ...args)
  }
}

async function queryGet(database, code, canUpdate = false) {
  const reader = new QueryReader(database)
  const writer = new QueryWriter(database, canUpdate)
  await code(reader, writer)
  return writer.getResults()
}

async function querySingleGet(database, code) {
  const reader = new QueryReader(database)
  const writer = new QueryWriter(database)
  await code(reader, writer)
  return writer.getResults()[0] || null
}

queryGet.single = querySingleGet
queryGet.QueryWriter = QueryWriter
queryGet.QueryReader = QueryReader

export default queryGet
