const ScriptContext = require('@live-change/db/lib/WebScriptContext.js')
const dbDao = require('./dbDao.js')
const storeDao = require('./storeDao.js')
const createBackend = require("./backend.js")

const ReactiveDao = require("@live-change/dao")

const Database = require('@live-change/db').Database

class DatabaseStore {
  constructor(path, backend, options) {
    this.path = path
    this.backend = backend
    this.stores = new Map()

    this.db = backend.createDb(path, options)
  }
  close() {
    return this.backend.closeDb(this.db)
  }
  delete() {
    return this.backend.deleteDb(this.db)
  }
  getStore(name, options = {}) {
    let store = this.stores.get(name)
    if(store) return store
    store = this.backend.createStore(this.db, name, options)
    this.stores.set(name, store)
    return store
  }
  closeStore(name) {
    let store = this.stores.get(name)
    if(!store) return;
    return this.backend.closeStore(store)
  }
  deleteStore(name) {
    let store = this.getStore(name)
    return this.backend.deleteStore(store)
  }
}

class Server {
  constructor(config) {
    this.config = config
    this.databases = new Map()
    this.metadata = null
    this.databaseStores = new Map()

    this.databasesListObservable = new ReactiveDao.ObservableList([])

    this.backend = createBackend(config)

    this.metadataSavePromise = null
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
      const jsonStr = localStorage[`${this.config.dbPrefix || ''}_lcdb`]
      this.metadata = jsonStr && JSON.parse(jsonStr)
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
      dbStore = new DatabaseStore(dbPath, this.backend, dbConfig.storage)
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
    localStorage[`${this.config.dbPrefix || ''}_lcdb`] = JSON.stringify(this.metadata)
  }

  async close() {
    for(const db of this.databaseStores.values()) db.close()
  }
}

module.exports = Server
