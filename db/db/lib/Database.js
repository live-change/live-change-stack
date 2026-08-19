import Table from './Table.js'
import Index from './Index.js'
import Log from './Log.js'
import queryGet from './queryGet.js'
import queryObservable from './queryObservable.js'
import getRandomValues from 'get-random-values'

import ReactiveDao from "@live-change/dao"

import { combineStoreStats, readStoreStat } from './storeStats.js'
import { clearOpLogStore } from './clearOpLog.js'

import Debug from 'debug'
const debug = Debug('db')

class Database {
  constructor(config, storeFactory, saveConfig, deleteStore, name, createScriptContext) {
    this.name = name
    this.config = {
      tables: {},
      indexes: {},
      logs: {},
      ...config
    }
    this.saveConfig = saveConfig || (() => {})
    this.storeFactory = storeFactory
    this.deleteStore = deleteStore
    this.stores = new Map()
    this.tables = new Map()
    this.logs = new Map()
    this.indexes = new Map()
    this.createScriptContext = createScriptContext

    this.configObservable = new ReactiveDao.ObservableValue(JSON.parse(JSON.stringify(this.config)))
    this.configObservable.observe(() => {}) // prevent dispose and clear
    this.tablesListObservable = new ReactiveDao.ObservableList(Object.keys(this.config.tables))
    this.indexesListObservable = new ReactiveDao.ObservableList(Object.keys(this.config.indexes))
    this.logsListObservable = new ReactiveDao.ObservableList(Object.keys(this.config.logs))
    this.tablesListObservable.observe(() => {}) // prevent dispose and clear
    this.indexesListObservable.observe(() => {}) // prevent dispose and clear
    this.logsListObservable.observe(() => {}) // prevent dispose and clear  
  }

  async start(startConfig = {}) {
    if(startConfig.slowStart) {
      for(let name in this.config.tables) await this.table(name)
      for(let name in this.config.logs) await this.log(name)
      for(let name in this.config.indexes) await (async (name) => {
        try {
          await this.index(name)
        } catch(error) {
          return 'ok'
        }
      })(name)
    } else {
      let promises = []
      for(let name in this.config.tables) promises.push(this.table(name))
      for(let name in this.config.logs) promises.push(this.log(name))
      for(let name in this.config.indexes) promises.push((async (name) => {
        try {
          await this.index(name)
        } catch(error) {
          return 'ok'
        }
      })(name))
      return Promise.all(promises).then(r => 'ok')
    }
  }

  generateUid() {
    const array = new Uint8Array(8)
    getRandomValues(array)
    return [...array].map (b => b.toString(16).padStart (2, "0")).join ("")
  }

  store(name, config) {
    let store = this.stores.get(name)
    if(!store) {
      store = this.storeFactory(name, config)
      this.stores.set(name, store)
    }
    return store
  }

  createTable(name, config = {}) {
    if(this.config.tables[name]) throw new Error(`Table ${name} already exists`)
    const uid = config.uid || this.generateUid()
    this.config.tables[name] = { ...config, uid }
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
    this.tablesListObservable.push(name)
    return this.table(name)
  }

  async deleteTable(name) {
    const config = this.config.tables[name]
    if(!config) throw new Error(`Table ${name} not found`)
    const table = this.table(name)
    await table.deleteTable()
    delete this.config.tables[name]
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
    this.tablesListObservable.remove(name)
    this.tables.delete(name)
  }

  renameTable(name, newName) {
    if(this.config.tables[newName]) throw new Error(`Table ${newName} already exists`)
    const table = this.table(name)
    table.name = newName
    this.config.tables[newName] = this.config.tables[name]
    delete this.config.tables[name]
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
    this.tablesListObservable.push(newName)
    this.tablesListObservable.remove(name)
    this.tables.set(newName, table)
    this.tables.delete(name)
  }

  table(name) {
    let table = this.tables.get(name)
    if(!table) {
      const config = this.config.tables[name]
      if(!config) throw new Error(`Table ${name} not found`)
      table = new Table(this, name, config)
      this.tables.set(name, table)
    }
    return table
  }

  createLog(name, config = {}) {
    if(this.config.logs[name]) throw new Error(`Log ${name} already exists`)
    const uid = config.uid || this.generateUid()
    this.config.logs[name] = { ...config, uid }
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
    this.logsListObservable.push(name)
    return this.log(name)
  }

  async deleteLog(name) {
    const config = this.config.logs[name]
    if(!config) throw new Error(`Log ${name} not found`)
    const log = this.log(name)
    await log.deleteLog()
    delete this.config.logs[name]
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
    this.logsListObservable.remove(name)
    this.logs.delete(name)
  }

  renameLog(name, newName) {
    if(this.config.logs[newName]) throw new Error(`Log ${newName} already exists`)
    const log = this.log(name)
    log.name = newName
    this.config.logs[newName] = this.config.logs[name]
    delete this.config.logs[name]
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
    this.logsListObservable.push(newName)
    this.logsListObservable.remove(name)
    this.logs.set(newName, log)
    this.logs.delete(name)
  }

  log(name) {
    let log = this.logs.get(name)
    if(!log) {
      const config = this.config.logs[name]
      if(!config) throw new Error(`Log ${name} not found`)
      log = new Log(this, name, config)
      this.logs.set(name, log)
    }
    return log
  }

  async createIndex(name, code, params, config = {}) {
    if(this.config.indexes[name]) throw new Error(`Index ${name} already exists`)
    config.code = typeof code == 'string' ? code : `(${code})`
    config.parameters = params
    const uid = config.uid || this.generateUid()
    this.config.indexes[name] = { ...config, uid }
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
    this.indexesListObservable.push(name)
    return await this.index(name)
  }

  async deleteIndex(name) {
    const config = this.config.indexes[name]
    if(!config) throw new Error(`Index ${name} not found`)
    const index = this.indexes.get(name)
    if(index) {
      await index.deleteIndex()
      this.indexes.delete(name)
    } else {
      await this.deleteStore(config.uid + '.data')
      await this.deleteStore(config.uid + '.opLog')
    }
    delete this.config.indexes[name]
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
    this.indexesListObservable.remove(name)
    if(this.onIndexRemoved) this.onIndexRemoved(config.uid)
  }

  renameIndex(name, newName) {
    if(this.config.indexes[newName]) throw new Error(`Index ${newName} already exists`)
    const index = this.index(name)
    index.name = newName
    this.config.indexes[newName] = this.config.indexes[name]
    delete this.config.indexes[name]
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
    this.indexesListObservable.push(newName)
    this.indexesListObservable.remove(name)
    this.indexes.set(newName, index)
    this.indexes.delete(name)
  }

  async clearIndexOpLogByConfig(name, config, lastTimestamp, limit, options = {}) {
    const index = this.indexes.get(name)
    if(index) return index.clearOpLog(lastTimestamp, limit, options)
    const opLog = this.store(config.uid + '.opLog', { ...config, ...config.opLog })
    return clearOpLogStore(opLog, lastTimestamp, limit, null, options)
  }

  async clearOpLogs(lastTimestamp, limit, options = {}) {
    const results = []
    for(const name in this.config.tables) {
      const result = await this.table(name).clearOpLog(lastTimestamp, limit, options)
      results.push({ ...result, type: 'table', name })
    }
    for(const name in this.config.indexes) {
      try {
        const config = this.config.indexes[name]
        const result = await this.clearIndexOpLogByConfig(name, config, lastTimestamp, limit, options)
        results.push({ ...result, type: 'index', name })
      } catch(error) {
        results.push({ type: 'index', name, count: 0, last: "\xFF\xFF\xFF\xFF" })
      }
    }
    const summary = results.reduce(
        (a, b) => ({ count: a.count + b.count, last: a.last < b.last ? a.last : b.last }),
        { count: 0, last: "\xFF\xFF\xFF\xFF" })
    summary.results = results
    return summary
  }

  async deleteOpLogs() {
    let promises = []
    for(let name in this.config.tables) promises.push((async (name) => {
      const result = await this.table(name).deleteOpLog()
      return { ...result, type: 'table', name }
    })(name))
    for(let name in this.config.indexes) promises.push((async (name) => {
        try {
          const index = await this.index(name)
          const result = await index.deleteOpLog()
          return { ...result, type: 'index', name }
        } catch(error) {
          return { type: 'index', name }
        }
      })(name))
    const results = await Promise.all(promises)
    return results
  }

  async index(name) {
    let index = this.indexes.get(name)
    if(!index) {
      const config = this.config.indexes[name]
      if(!config) throw new Error(`Index ${name} not found`)
      let code = config.code
      const params = config.parameters
      index = new Index(this, name, code, params, config)
      this.indexes.set(name, index)
      try {
        await index.startIndex()
      } catch(error) {
        index.enterSleep(error)
        return index
      }
      return index
    }
    if(index.isSleeping && index.isSleeping()) return index
    if(index.startPromise) await index.startPromise
    return index
  }

  async wakeIndex(name) {
    const index = this.indexes.get(name)
    if(!index) return null
    if(!index.isSleeping || !index.isSleeping()) return index
    if(index.waking) return index
    index.waking = true
    try {
      if(index.needsFullRebuild) await index.prepareForWake()
      index.startPromise = null
      index.lastSleepLogKey = null
      try {
        await index.startIndex()
      } catch(error) {
        index.enterSleep(error)
      }
      return index
    } finally {
      index.waking = false
    }
  }

  queryGet(code) {
    return queryGet(this, code)
  }

  queryUpdate(code) {
    return queryGet(this, code, true)
  }

  queryObservable(code) {
    return queryObservable(this, code)
  }

  queryObjectGet(code) {
    return queryGet.single(this, code)
  }

  queryObjectObservable(code) {
    return queryObservable.single(this, code)
  }

  handleUnhandledRejectionInIndex(name, reason) {
    const config = this.config.indexes[name]
    const index = this.indexes.get(name)
    if(index) {
      index.enterSleep(reason)
      return
    }
    console.error("INDEX", name, "unhandledRejection", reason, "CODE:\n", config?.code,
      "\nPARAMS:\n", config?.parameters, "\nSTACK:\n", reason.stack, "\nPROMISE:\n", reason.promise)
  }
  handleConfigUpdated() {
    this.saveConfig(this.config)
    this.configObservable.set(JSON.parse(JSON.stringify(this.config)))
  }

  storageStatsForConfig(type, name, config) {
    const uid = config.uid
    let combined
    if(type === 'log') {
      combined = combineStoreStats(
        readStoreStat(this.store(uid + '.log', { ...config, ...config.data })),
        null
      )
    } else {
      combined = combineStoreStats(
        readStoreStat(this.store(uid + '.data', { ...config, ...config.data })),
        readStoreStat(this.store(uid + '.opLog', { ...config, ...config.opLog }))
      )
    }
    return {
      type,
      name,
      uid,
      ...combined
    }
  }

  storageStats() {
    const stores = []
    for(const name in this.config.tables) {
      stores.push(this.storageStatsForConfig('table', name, this.config.tables[name]))
    }
    for(const name in this.config.indexes) {
      stores.push(this.storageStatsForConfig('index', name, this.config.indexes[name]))
    }
    for(const name in this.config.logs) {
      stores.push(this.storageStatsForConfig('log', name, this.config.logs[name]))
    }

    let dataUsedBytes = 0
    let opLogUsedBytes = 0
    let storeUsedBytes = 0
    let entryCount = 0
    let hasBytes = false
    let hasEntries = false

    for(const row of stores) {
      if(row.data && row.data.available) {
        dataUsedBytes += row.data.usedBytes || 0
        hasBytes = true
        if(row.data.entryCount != null) {
          entryCount += row.data.entryCount
          hasEntries = true
        }
      }
      if(row.opLog && row.opLog.available) {
        opLogUsedBytes += row.opLog.usedBytes || 0
        hasBytes = true
      }
      if(row.usedBytes != null) {
        storeUsedBytes += row.usedBytes
        hasBytes = true
      }
    }

    return {
      stores,
      totals: {
        dataUsedBytes: hasBytes ? dataUsedBytes : null,
        opLogUsedBytes: hasBytes ? opLogUsedBytes : null,
        storeUsedBytes: hasBytes ? storeUsedBytes : null,
        entryCount: hasEntries ? entryCount : null
      }
    }
  }
}

export default Database
