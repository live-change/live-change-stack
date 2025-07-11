import IntervalTreeLib from 'node-interval-tree'
const IntervalTree = IntervalTreeLib.default || IntervalTreeLib
import ReactiveDao from "@live-change/dao"
import Table from './Table.js'
import queryGet from './queryGet.js'
import profileLog from './profileLog.js'
import nextTick from 'next-tick'
import { ChangeStream } from './ChangeStream.js'
import { rangeIntersection } from './utils.js'


import Debug from 'debug'
const debug = Debug('db')

const opLogBatchSize = 128 /// TODO: increase after testing

class ObjectReader extends ChangeStream {
  constructor(tableReader, id) {
    super()
    this.tableReader = tableReader
    this.id = id
    this.callbacks = []
  }
  onChange(cb) {
    this.callbacks.push(cb)
    return {
      dispose() {
        const callbackIndex = this.callbacks.indexOf(cb)
        if(callbackIndex === -1) throw new Error('Observer double dispose')
        this.callbacks.splice(callbackIndex, 1)
        /// TODO: dispose or ignore reader somehow if no callbacks
      }
    }
  }
  async change(obj, oldObj, id, timestamp) {
    for(const callback of this.callbacks) await callback(obj, oldObj, id, timestamp)
  }
  async get() {
    return await (await this.tableReader.table).objectGet(this.id)
  }
  async rangeGet(range) {
    return await (await this.tableReader.table).rangeGet(rangeIntersection(unitRange(this.id), range))
  }
  range(range) {
    return new RangeReader(this.tableReader, unitRange(this.id))
  }
  object(id) {  
    return new ObjectReader(this.tableReader, id)
  }
  async objectGet(id) {
    return await (await this.tableReader.table).objectGet(id)
  }
  async count(range = {}) {
    return await (await this.tableReader.table).countGet(rangeIntersection(unitRange(this.id), range))
  }
  dispose() {}
}

class RangeReader extends ChangeStream {
  constructor(tableReader, range) {
    super()
    this.tableReader = tableReader
    this.range = range
    this.rangeDescr =[ this.range.gt || this.range.gte || '', this.range.lt || this.range.lte || '\xFF\xFF\xFF\xFF' ]
    this.tableReader.rangeTree.insert(...this.rangeDescr, this )
    this.callbacks = []
  }
  async onChange(cb) {
    this.callbacks.push(cb)
    return {
      dispose() {
        const callbackIndex = this.callbacks.indexOf(cb)
        if(callbackIndex === -1) throw new Error('Observer double dispose')
        this.callbacks.splice(callbackIndex, 1)
        /// TODO: dispose or ignore reader somehow if no callbacks
      }
    }
  }
  async change(obj, oldObj, id, timestamp) {
    for(const callback of this.callbacks) await callback(obj, oldObj, id, timestamp)
  }
  async rangeGet(range) {
    return await (await this.tableReader.table).rangeGet(rangeIntersection(this.range, range))
  }
  range(range) {
    return new RangeReader(this.tableReader, rangeIntersection(this.range, range))
  }
  async get() {
    return await (await this.tableReader.table).rangeGet(this.range)
  }
  async objectGet(id) {
    return await (await this.tableReader.table).objectGet(id)
  }
  object(id) {
    return new ObjectReader(this.tableReader, id)
  }
  async count(range = {}) {
    return await (await this.tableReader.table).countGet(rangeIntersection(this.range, range))
  }
}

class TableReader extends ChangeStream {

 /* set opLogPromise(promise) {
    console.trace("SET PROMISE", promise)
    this.oplP = promise
  }
  get opLogPromise() {
    return this.oplP
  }*/

  constructor(opLogReader, prefix, table, isLog) {
    super()
    this.opLogReader = opLogReader
    this.prefix = prefix
    this.table = table
    Promise.resolve(this.table).then(t=> {if(!t) throw new Error("TABLE NOT FOUND!!!")})
    this.isLog = isLog
    this.objectReaders = new Map()
    this.rangeReaders = new Map()
    this.rangeTree = new IntervalTree()
    this.disposed = false
    this.callbacks = []

    this.readOpLog(this.opLogReader.currentKey)

    let firstFull = 0
    /*setInterval(() => {
      if(this.opLogObservable && this.opLogObservable.list && this.opLogObservable.list.length == opLogBatchSize) {
        if(firstFull > 0) {
          console.error("TABLE READER", prefix, "OPLOG FULL TOO LONG!")
          process.exit(1)
        } else {
          firstFull = Date.now()
        }
      } else {
        firstFull = 0
      }
    }, 1000)*/
/*    //if(this.prefix == 'table_triggers'){
      let triggersDataJson = ""
      setInterval(() => {
        if(JSON.stringify(this.opLogObservable && this.opLogObservable.list) != triggersDataJson) {
          console.log("TABLE READER RANGE", this.opLogObservableRange)
          console.log("TABLE READER STATE", this.opLogObservable.list)
          console.log("TABLE READER REQUEST ID", this.opLogObservable.requestId)
          triggersDataJson = JSON.stringify(this.opLogObservable && this.opLogObservable.list)
        }
      },500)
    }*/
  }
  async onChange(cb) {
    this.callbacks.push(cb)
  }
  async change(obj, oldObj, id, timestamp) {
    if(!(obj || oldObj)) return
    if(typeof id != 'string') throw new Error(`ID is not string: ${JSON.stringify(id)}`)
    const profileOp = profileLog.started
        ? await profileLog.begin({
          operation: 'processIndexChange', index: this.opLogReader.indexName, source: this.prefix + this.table
        })
        : null
    const objectReader = this.objectReaders.get(id)
    if(objectReader) objectReader.change(obj, oldObj, id, timestamp)
    const rangeReaders = this.rangeTree.search(id, id)
    for(const rangeReader of rangeReaders) {
      rangeReader.change(obj, oldObj, id, timestamp)
    }
    for(const callback of this.callbacks) await callback(obj, oldObj, id, timestamp)
    if(profileOp) await profileLog.end(profileOp)
  }
  async rangeGet(range) {
    return await (await this.table).rangeGet(range)
  }
  range(range) {
    const key = JSON.stringify(range)
    let reader = this.rangeReaders.get(key)
    if(!reader) {
      if(range.offset || range.limit) throw new Error("offset and limit in range indexes not supported")
      reader = new RangeReader(this, range)
      this.rangeReaders.set(key, reader)
    }
    return reader
    return new RangeReader(this, range)
  }
  async objectGet(id) {
    return await (await this.table).objectGet(id)
  }
  async count(range = {}) {
    return await (await this.table).count(rangeIntersection(this.range, range))
  }
  object(id) {
    let reader = this.objectReaders.get(id)
    if(!reader) {
      reader = new ObjectReader(this, id)
      this.objectReaders.set(id, reader)
    }
    return reader
    return new ObjectReader(this, id)
  }
  dispose() {
    this.disposed = true
    for(let objectReader of this.objectReaders.values()) {
      try {
        objectReader.dispose()
      } catch(e) {
        console.error("ERROR DISPOSING OBJECT READER", objectReader)
        throw e
      }
    }
    for(let rangeReader of this.rangeReaders.values()) {
      try {
        rangeReader.dispose()
      } catch(e) {
        console.error("ERROR DISPOSING RANGE READER", rangeReader)
        throw e
      }
    }
  }

  async readOpLog(key) {
    //console.log("READ OP LOG")
    if(this.opLogPromise) return this.opLogPromise
    if(this.opLogObservable && this.opLogObservable.list && this.opLogObservable.list.length < opLogBatchSize) {
      console.error("SHOULD NOT READ NOT FINISHED OPLOG", this.opLogObservable.list)
      console.trace("READ OP LOG TOO EARLY!!!")
      process.exit(10)
    }
    //console.log("DO READ OPLOG", key)
    if(this.opLogObservable) {
      this.opLogObservable.unobserve(this)
      this.opLogObservable = null
    }
    this.opLogPromise = new Promise(async (resolve,reject) => {
      this.opLogResolve = resolve
      if(!this.opLog) this.opLog = this.isLog ? (await this.table).data : (await this.table).opLog
      //console.log("READ OP LOG", this.prefix, key, opLogBatchSize)
      this.opLogObservableRange = { gt: key, limit: opLogBatchSize }
      //console.log("READ OP LOG", this.prefix, "RANGE", JSON.stringify(this.opLogObservableRange))
      this.opLogObservable = this.opLog.rangeObservable(this.opLogObservableRange)
      /// NEXT TICK BECAUSE IT CAN FINISH BEFORE EVENT START xD
      nextTick(() => this.opLogObservable.observe(this))
    })
    return this.opLogPromise
  }
  set(value) {
    if(!value) return
    this.opLogBuffer = value.slice()
    //console.log("PROMISE", this.opLogPromise)
    if(this.opLogResolve) {
      const resolve = this.opLogResolve
      this.opLogResolve = null
      this.opLogPromise = null
      //console.log("RESOLVE OPLOG PROMISE", resolve)
      resolve(value)
    }
    this.opLogReader.handleSignal()
  }
  putByField(field, id, object) {
    //if(this.prefix == 'table_triggers') console.log("TABLE", this.prefix, " READER PUT", object, this.disposed)
    if(this.disposed) return
    if(field !== 'id') throw new Error("incompatible range protocol")
    this.opLogBuffer.push(object)
    this.opLogReader.handleSignal()
  }
  push(object) {
    if(this.disposed) return
    this.opLogBuffer.push(object)
    this.opLogReader.handleSignal()
  }
  async objectGet(id) {
    return await (await this.table).objectGet(id)
  }
  async get(range = {}) {
    return await (await this.table).rangeGet(range)
  }
  async count(range = {}) {
    return await (await this.table).countGet(range)
  }
  async nextKey() {
    while(true) {
      //console.log("LOOKING FOR NEXT KEY IN", this.prefix)
      await this.opLogPromise
      if(this.opLogPromise != null) {
        console.trace("IMPOSIBBLE!")
        process.exit(11)
      }
      //console.log("FB", this.opLogBuffer && this.opLogBuffer.length)
      if (this.opLogBuffer && this.opLogBuffer.length) return this.opLogBuffer[0].id
      //console.log("NK", this.opLogObservable && this.opLogObservable.list, " < ", opLogBatchSize)
      if (this.opLogObservable && this.opLogObservable.list && this.opLogObservable.list.length < opLogBatchSize)
        return null // waiting for more
      //console.log("READING NEXT KEY IN", this.prefix)
      const lastKey = this.opLogObservable.list[this.opLogObservable.list.length - 1].id
      await this.readOpLog(lastKey)
      //console.log("READED OPLOG", this.prefix)
    }
  }
  async readTo(endKey) {
    let lastKey = null
    while(this.opLogBuffer[0] && this.opLogBuffer[0].id <= endKey) {
      const next = this.opLogBuffer.shift()
      lastKey = next.id
      if(this.isLog) {
        await this.change(next, null, next.id, next.id)
      } else {
        const op = next.operation
        if(op) {
          if(op.type === 'put') {
            await this.change(op.object, op.oldObject, op.object.id, next.id)
          }
          if(op.type === 'delete') {
            //console.log("DELETE CHANGE", next)
            await this.change(null, op.object, op.object.id, next.id)
          }
        } else {
          console.error("NULL OPERATION", next)
        }
      }
      if(this.opLogBuffer.length === 0 && this.opLogObservable.list.length >= opLogBatchSize) {
        //console.log("ENTER OPLOG READ!")
        await this.readOpLog(this.opLogObservable.list[this.opLogObservable.list.length - 1].id)
        //console.log("READ TO RESULT, OP LOG PROMISE:", this.opLogPromise)
      }
    }
    return lastKey
  }
}

class OpLogReader {
  constructor(database, startingKey, onNewSource, indexName) {
    this.database = database
    this.currentKey = startingKey
    this.onNewSource = onNewSource || (() => {})
    this.indexName = indexName
    this.tableReaders = []
    this.readingMore = false
    this.gotSignals = false
    this.disposed = false
  }
  table(name) {
    const prefix = 'table_'+name
    let reader = this.tableReaders.find(tr => tr.prefix === prefix)
    if(!reader) {
      reader = new TableReader(this, prefix, this.database.table(name))
      this.tableReaders.push(reader)
      this.onNewSource('table', name)
    }
    return reader
  }
  index(name) {
    const prefix = 'index_'+name
    let reader = this.tableReaders.find(tr => tr.prefix === prefix)
    if(!reader) {
      reader = new TableReader(this, prefix, this.database.index(name))
      this.tableReaders.push(reader)
      this.onNewSource('index', name)
    }
    return reader
  }
  log(name) {
    const prefix = 'log_'+name
    let reader = this.tableReaders.find(tr => tr.prefix === prefix)
    if(!reader) {
      reader = new TableReader(this, prefix, this.database.log(name), true)
      this.tableReaders.push(reader)
      this.onNewSource('log', name)
    }
    return reader
  }

  handleSignal() {
    if(this.readingMore) {
      //if(this.indexName == 'triggers_new') console.log("STORE SIGNAL")
      this.gotSignals = true
    } else {
      //if(this.indexName == 'triggers_new') console.log("READ MORE ON SIGNAL")
      this.readMore()
    }
  }
  async readMore() {
    this.readingMore = true
    do {
      while(true) {
        this.gotSignals = false
        if(this.disposed) return
        const now = Date.now()
        //console.log("LOOKING FOR NEXT KEYS")
        let possibleNextKeys = await Promise.all(
            this.tableReaders.map(async tr => ({ reader: tr, key: await tr.nextKey() }))
        )
        //console.log("GOT NEXT KEYS")
        if(this.disposed) return
        //console.log("POSSIBLE NEXT KEYS", possibleNextKeys.map(({key, reader}) => [reader.prefix, key]))
        if(possibleNextKeys.length === 0) { /// It could happen when oplog is cleared
          return
        }
        let next = null
        for (const possibleKey of possibleNextKeys) {
          if (possibleKey.key && (!next || possibleKey.key < next.key)) {
            next = possibleKey
          }
        }
        //console.log("NEXT", next)
        //console.log("NEXT KEY", next && next.reader && next.reader.prefix, next && next.key)
        const lastKey = '\xFF\xFF\xFF\xFF'
        //console.log("NEXT", !!next, "KEY", next && next.key, lastKey)
        if(!next || next.key === lastKey) break // nothing to read
        let otherReaderNext = null
        for(const possibleKey of possibleNextKeys) {
          if(possibleKey.reader !== next.reader && possibleKey.key
              && (!otherReaderNext || possibleKey.key < otherReaderNext.key))
            otherReaderNext = possibleKey
        }
        /*console.log("OTHER READ NEXT", otherReaderNext && otherReaderNext.reader && otherReaderNext.reader.prefix,
            otherReaderNext && otherReaderNext.key)*/
        let readEnd = (otherReaderNext && otherReaderNext.key) // Read to next other reader key
            || (((''+(now - 1))).padStart(16, '0'))+':' // or to current timestamp
        if(readEnd < next) {
          readEnd = next.key+'\xff'
        }

        if((next.key||'') < this.currentKey) {
          //debugger
          console.error("time travel", next.key, this.currentKey)
          //process.exit(1) /// TODO: do something about it!
        }
        //console.log("CKN", this.currentKey, '=>', next.key)
        this.currentKey = next.key
        //console.log("READ TO", readEnd)
        try {
          const readKey = await next.reader.readTo(readEnd)
          //console.log("READED")
          if(readKey) {
            if((readKey||'') < this.currentKey) {
              //debugger
              console.error("time travel", readKey, this.currentKey)
              //process.exit(1) /// TODO: do something about it!
            }
            //console.log("CKR", this.currentKey, '=>', readKey)
            this.currentKey = readKey
          }
        } catch(error) {
          this.database.handleUnhandledRejectionInIndex(this.indexName, error)
        }
      }
    } while(this.gotSignals)
    this.readingMore = false
  }
  dispose() {
    this.disposed = true
    for(const reader of this.tableReaders) {
      reader.dispose()
    }
  }
}

class IndexWriter {
  constructor(index) {
    this.index = index
  }
  put(object) {
    const id = object.id
    if(!id) throw new Error(`ID is empty ${JSON.stringify(object)}`)
    this.index.put(object)
  }
  delete(object) {
    const id = typeof object === 'string' ? object :  object.id
    if(!id) throw new Error(`ID is empty ${JSON.stringify(object)}`)
    this.index.delete(id)
  }
  update(id, ops) {
    if(typeof id != 'string') {
      console.error("Index update id is corrupted", JSON.stringify(id))
      console.error("INDEX", this.index.name)
      console.error("INDEX CODE", this.index.codeObservable.value)
      console.error("INDEX PARAMS", this.index.params)
    }
    this.index.update(id, ops)
  }
  change(obj, oldObj) {
    try {
      if (obj) {
        if (oldObj && oldObj.id !== obj.id) {
          this.index.delete(oldObj.id)
          this.index.put(obj)
        } else {
          this.index.put(obj)
        }
      } else {
        if (oldObj) this.index.delete(oldObj.id)
      }
    } catch(error) {
      console.error("ERROR", error, "ON CHANGE", oldObj, "=>", obj)
      throw error
    }
  }
  objectGet(id) {
    return this.index.objectGet(id)
  }
  rangeGet(range) {
    return this.index.rangeGet(range)
  }
  synchronized(key, code) {
    return this.index.synchronized(key, code)
  }
  timeout(date, callback) {
    throw new Error('index timeouts not implemented yet!')
  }
  debug(...args) {
    console.log('INDEX', this.index.name, 'DEBUG', ...args)
  }
}

const INDEX_CREATING = 0
const INDEX_UPDATING = 1
const INDEX_READY = 2

class Index extends Table {
  constructor(database, name, code, params, config) {
    super(database, name, config)
    this.database = database
    this.codeObservable = new ReactiveDao.ObservableValue(code)
    this.codeObservable.observe(() => {}) // prevent dispose and clear
    this.params = params
    this.code = code
    this.startPromise = null
  }
  async startIndex() {
    if(!this.startPromise)this.startPromise = this.startIndexInternal()
    return this.startPromise
  }
  async startIndexInternal() {
    debug("STARTING INDEX", this.name, "IN DATABASE", this.database.name)
    debug("EXECUTING INDEX CODE", this.name)
    this.scriptContext = this.database.createScriptContext({
      /// TODO: script available routines
    })
    debug("COMPILE INDEX CODE", this.code)
    const queryFunction = this.scriptContext.getOrCreateFunction(this.code,
      `userCode:${this.database.name}/indexes/${this.name}`)
    if(typeof queryFunction != 'function') {
      console.error("INDEX CODE", this.code)
      console.error("QUERY FUNCTION", typeof queryFunction, queryFunction)
      process.exit(15)
      throw new Error("Index code is not a function")
    }
    this.codeFunction = (input, output) => queryFunction(input, output, this.params)
    this.writer = new IndexWriter(this)
    this.reader = null
    debug("STARTING INDEX", this.name)
    const lastIndexOperations = await this.opLog.rangeGet({ reverse: true, limit: 1 })
    const lastIndexOperation = lastIndexOperations[0]
    let lastUpdateTimestamp = 0
    if(!lastIndexOperation) { // Create Index from scratch
      //console.log("RECREATING INDEX", this.name)
      let indexCreateTimestamp = Date.now()
      this.state = INDEX_CREATING
      let timeCounter = 0
      const startReader = new queryGet.QueryReader(this.database, () => (''+(++timeCounter)).padStart(16, '0'),
          (sourceType, sourceName) => this.addSource(sourceType, sourceName))
      await this.codeFunction(startReader, this.writer)
      lastUpdateTimestamp = indexCreateTimestamp - 1000 // one second overlay
      this.opLogWritter({
        type: 'indexed'
      })
    } else {
      lastUpdateTimestamp = lastIndexOperation.timestamp - 1000 // one second overlap
      //console.log("UPDATING INDEX", this.name, "FROM", lastUpdateTimestamp)
      this.state = INDEX_UPDATING
    }
    const lastUpdateKey = ((''+lastUpdateTimestamp).padStart(16, '0'))+':'
    //console.log("INDEX SYNC FROM", lastUpdateKey)
    this.reader = new OpLogReader(this.database, lastUpdateKey,
        (sourceType, sourceName) => this.addSource(sourceType, sourceName),
        this.name)
    let codePromise
    codePromise = this.codeFunction(this.reader, this.writer)
    //console.log("READING!")
    await this.reader.readMore()
    debug("WAITING FOR CODE!", this.name)
    await codePromise
    this.state = INDEX_READY
    const startTime = Date.now()
    debug("INDEX STARTED!", this.name)
    await this.opLog.put({
      id: ((''+startTime).padStart(16, '0'))+':000000',
      timestamp: startTime,
      operation: {
        type: 'indexed'
      }
    })
    debug("STARTED INDEX", this.name, "IN DATABASE", this.database.name)
  }
  async deleteIndex() {
    this.reader.dispose()
    await this.deleteTable()
  }
  addSource(sourceType, sourceName) {
    const config = JSON.parse(JSON.stringify(this.configObservable.value))
    if(!config.sources) config.sources = []
    const existingSourceInfo = config.sources.find(({type, name}) => type === sourceType && name === sourceName )
    if(existingSourceInfo) return
    const newSourceInfo = { type: sourceType, name: sourceName }
    config.sources.push(newSourceInfo)
    debug("NEW INDEX", this.name, "SOURCE DETECTED", sourceType, sourceName)
    this.configObservable.set(config)
    this.database.config.indexes[this.name] = config
    this.database.handleConfigUpdated()
  }
}

export default Index
