import ScriptContext from '@live-change/db/lib/WebScriptContext.js'
import * as dbDao from './dbDao.js'
import * as storeDao from './storeDao.js'
import createBackend from "./backend.js"

import ReactiveDao from "@live-change/dao"

import { Database } from '@live-change/db'

class DatabaseStore {
  constructor(path, backends, options) {
    this.path = path
    this.backends = backends
    this.stores = new Map()

    this.dbs = {}
    this.dbs.default = this.backends.default.createDb(path, options)
  }
  close() {
    for(let key in this.dbs) {
      return this.backends[key].closeDb(this.dbs[key])
    }
  }
  delete() {
    for(let key in this.dbs) {
      return this.backends[key].deleteDb(this.dbs[key])
    }
  }
  getStore(name, options = {}) {
    let store = this.stores.get(name)
    if(store) return store
    const backendName = options.backend ?? (options.memory ? 'memory' : 'default')
    if(!this.backends[backendName]) {
      throw new Error(`db ${path} backend ${backendName} not configured`)
    }
    if(!this.dbs[backendName]) {
      this.dbs[backendName] = this.backends[backendName].createDb(this.path, options)
    }
    store = this.backends[backendName].createStore(this.dbs[backendName], name, options)
    store.backendName = backendName
    this.stores.set(name, store)
    return store
  }
  closeStore(name) {
    let store = this.stores.get(name)
    if(!store) return;
    return this.backends[store.backendName].closeStore(store)
  }
  deleteStore(name) {
    let store = this.getStore(name)
    return this.backends[store.backendName].deleteStore(store)
  }
}

class Server {
  constructor(config) {
    this.config = config
    this.databases = new Map()
    this.metadata = null
    this.databaseStores = new Map()

    this.databasesListObservable = new ReactiveDao.ObservableList([])

    this.backends = {}
    if(config.backend && !this.backends.default) { // backward compatibility
      this.backends.default = createBackend({
        name: config.backend,
        url: config.backendUrl,
        maxDbs: config.maxDbs,
        maxDbSize: config.maxDbSize,
      })
    }
    for(let backend of config.backends || []) {
      if(typeof backend == 'string') {
        backend = { name: backend }
      }
      this.backends[backend.name] = createBackend(backend)
      if(!this.backends.default) {
        this.backends.default = this.backends[backend.name]
      }
    }
    if(!this.backends.default) {
      throw new Error("No default backend configured")
    }
    if(!this.backends.memory) {
      this.backends.memory = createBackend({
        name: "memory"
      })
    }

    this.metadataDatabase = this.backends.default.createDb('_db_metadata', {})
    this.metadataStore = this.backends.default.createStore(this.metadataDatabase, 'metadata', {})
  }
  createDao(session) {
    return new ReactiveDao(session, {
      database: {
        type: 'local',
        source: this.getDatabaseDao()
      },
      store: { /// Low level data access
        type: 'local',
        source: this.getStoreDao()
      }
    })
  }
  getDatabaseDao() {
    const scriptContext = new ScriptContext({
      /// TODO: script available routines
      console
    })
    return new ReactiveDao.SimpleDao({
      methods: {
        ...dbDao.localRequests(this, scriptContext)
      },
      values: {
        ...dbDao.localReads(this, scriptContext)
      }
    })
  }
  getStoreDao() {
    return new ReactiveDao.SimpleDao({
      methods: {
        ...storeDao.localRequests(this)
      },
      values: {
        ...storeDao.localReads(this)
      }
    })
  }
  async initialize(initOptions = {}) {
    if(initOptions.metadata) {
      this.metadata = initOptions.metadata
    } else {
      this.metadata = await this.metadataStore.objectGet('metadata')
    }
    if(!this.metadata) {
      this.metadata = {
        databases: {
          system: {
            tables: {},
            indexes: {},
            logs: {}
          }
        }
      }
    }
    for(const dbName in this.metadata.databases) {
      const dbConfig = this.metadata.databases[dbName]
      this.databases.set(dbName, await this.initDatabase(dbName, dbConfig))
      this.databasesListObservable.push(dbName)
    }
  }
  async initDatabase(dbName, dbConfig) {
    const dbPath = `${this.config.dbPrefix || ''}_lcdb`
    let dbStore = this.databaseStores.get(dbName)
    if(!dbStore) {
      const backend = this.backends[dbConfig.backend?.name ?? dbConfig.backend ?? 'default']
      dbStore = new DatabaseStore(dbPath, { ...this.backends, default: backend },
        typeof dbConfig.backend == 'object' ? dbConfig.backend : dbConfig.storage
      )
      this.databaseStores.set(dbName, dbStore)
    }
    const database = new Database(
      dbConfig,
      (name, config) => dbStore.getStore(name, config),
      (configToSave) => {
        this.metadata.databases[dbName] = configToSave
        this.saveMetadata()
      },
      (name) => dbStore.deleteStore(name),
      dbName,
      (context) => new ScriptContext(context)
    )
    database.onAutoRemoveIndex = (name, uid) => {
      this.databases.get('system').table(dbName+'_indexes').delete(uid)
    }
    await database.start()
    return database
  }

  async saveMetadata() {
    await this.metadataStore.put({ ...this.metadata, id: 'metadata' })
  }

  async close() {
    for(const db of this.databaseStores.values()) db.close()
  }
}

export default Server
