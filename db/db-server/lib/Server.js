import fs from 'fs'
import path from 'path'
import http from 'http'
import express from 'express'
import sockjs from '@live-change/sockjs'
import { server as WebSocketServer } from 'websocket'
import {
  server as ReactiveDaoWebsocketServer,
  client as ReactiveDaoWebsocketClient
} from '@live-change/dao-websocket'
import ScriptContext from '@live-change/db/lib/ScriptContext.js'
import * as dbDao from './dbDao.js'
import * as storeDao from './storeDao.js'
import createBackend from './backend.js'
import Replicator from './Replicator.js'
import { profileLog } from '@live-change/db'
import { Database } from '@live-change/db'
import ReactiveDao from '@live-change/dao'

import { fileURLToPath } from 'url'
const packageInfo = await fs.promises.readFile(fileURLToPath(
  new URL(import.meta.resolve('@live-change/db-server/package.json'))
), 'utf8')

import Debug from 'debug'
const debug = Debug('db-server')

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

    this.metadataSavePromise = null

    this.databasesListObservable = new ReactiveDao.ObservableList([])
    this.databasesListObservable.observe(() => {}) // prevent dispose and clear

    this.apiServer = new ReactiveDao.ReactiveServer((sessionId) => this.createDao(sessionId))

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

    if(this.config.master) {
      this.masterDao = new ReactiveDao('app', {
        remoteUrl: this.config.master,
        protocols: {
          'ws': ReactiveDaoWebsocketClient
        },
        connectionSettings: {
          queueRequestsWhenDisconnected: true,
          requestSendTimeout: 2000,
          requestTimeout: 5000,
          queueActiveRequestsOnDisconnect: false,
          autoReconnectDelay: 200,
          logLevel: 1
        },
        database: {
          type: 'remote',
          generator: ReactiveDao.ObservableList
        },
        store: {
          type: 'remote',
          generator: ReactiveDao.ObservableList
        }
      })
      this.replicator = new Replicator(this)
    }
  }

  createDaoConfig(session) {

    const store = { /// Low level data access
      type: 'local',
      source: new ReactiveDao.SimpleDao({
        methods: {
          ...(profileLog.started
              ? profileLog.profileFunctions(storeDao.localRequests(this))
              : storeDao.localRequests(this))
        },
        values: {
          ...storeDao.localReads(this)
        }
      })
    }

    const version = {
      type: 'local',
      source: new ReactiveDao.SimpleDao({
        methods: {},
        values: {
          version: {
            async observable() {
              return new ReactiveDao.ObservableValue((await packageInfo).version)
            },
            async get() {
              return (await packageInfo).version
            }
          }
        }
      })
    }

    const emptyServices = {
      observable(parameters) {
        return ReactiveDao.ObservableList([])
      },
      async get(parameters) {
        return []
      }
    }
    const sessionInfo = {
      client: { session: 'dbRoot' },
      services: []
    }
    const metadata = {
      type: "local",
      source: new ReactiveDao.SimpleDao({
        methods: {},
        values: {
          serviceNames: emptyServices,
          serviceDefinitions: emptyServices,
          api: {
            observable(parameters) {
              ReactiveDao.ObservableValue(sessionInfo)
            },
            async get(parameters) {
              return sessionInfo
            }
          }
        }
      })
    }

    const scriptContext = new ScriptContext({
      /// TODO: script available routines
      console
    })
    let database
    if(this.config.master) {
      database = {
        type: 'local',
        source: new ReactiveDao.SimpleDao({
          methods: {
            ...(profileLog.started
                ? profileLog.profileFunctions(dbDao.remoteRequests(this))
                : dbDao.remoteRequests(this))
          },
          values: {
            ...dbDao.localReads(this, scriptContext)
          }
        })
      }

    } else {
      database = {
        type: 'local',
        source: new ReactiveDao.SimpleDao({
          methods: {
            ...(profileLog.started
                ? profileLog.profileFunctions(dbDao.localRequests(this, scriptContext))
                : dbDao.localRequests(this, scriptContext))
          },
          values: {
            ...dbDao.localReads(this, scriptContext)
          }
        })
      }
    }

    return {
      //remoteUrl: this.config.master,
      database,
      serverDatabase: database,
      store, version, metadata
    }
  }
  createDao(session) {
    return new ReactiveDao(session, {
      ...this.createDaoConfig(session),
    })
  }
  async initialize(initOptions = {}) {
    if(!this.config.temporary) {
      const normalMetadataPath = path.resolve(this.config.dbRoot, 'metadata.json')
      const backupMetadataPath = path.resolve(this.config.dbRoot, 'metadata.json.bak')
      const normalMetadataExists = await fs.promises.access(normalMetadataPath).catch(err => false)
      const backupMetadataExists = await fs.promises.access(backupMetadataPath).catch(err => false)
      if(initOptions.forceNew && (normalMetadataExists || backupMetadataExists))
        throw new Error("database already exists")
      const normalMetadata = await fs.promises.readFile(normalMetadataPath, "utf8")
          .then(json => JSON.parse(json)).catch(err => null)
      const backupMetadata = await fs.promises.readFile(backupMetadataPath, "utf8")
          .then(json => JSON.parse(json)).catch(err => null)
      this.metadata = normalMetadata
      if(!normalMetadata) this.metadata = backupMetadata
      if(this.metadata && backupMetadata && this.metadata.timestamp < backupMetadata.timestamp)
        this.metadata = backupMetadata
      if(!this.metadata && (normalMetadataExists || backupMetadataExists)) throw new Error("database is broken")
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
    await this.checkInfoIntegrity()
    if(this.config.master) {
      await this.replicator.start()
    }
  }
  async checkInfoIntegrity() {
    for(const dbName in this.metadata.databases) {
      if(dbName !== 'system') {
        const metadata = this.metadata.databases[dbName]
        const indexesTable = this.databases.get('system').table(dbName + '_indexes')
        const indexesInfo = await indexesTable.rangeGet({})
        const infoByName = new Map()
        for(const indexInfo of indexesInfo) {
          const indexMeta = metadata?.indexes[indexInfo.name]
          if(!indexMeta || (indexMeta.uid !== indexInfo.id)) {
            console.error("CORRUPTED INDEX INFO", indexInfo.name, indexInfo.id)
            console.log("DELETING CORRUPTED INFO")
            await indexesTable.delete(indexInfo.id)
            continue
          } else if(infoByName.has(indexInfo.name)) {
            console.error("INDEX INFO DUPLIACTED", indexInfo.name)
            console.log("DB META", )
            console.log("INFO", indexInfo)
          }
          infoByName.set(indexInfo.name, indexInfo)
        }
      }
    }
  }
  async initDatabase(dbName, dbConfig) {
    const dbPath = this.config.temporary ? 'memory' : path.resolve(this.config.dbRoot, dbName+'.db')
    let dbStore = this.databaseStores.get(dbName)
    if(!dbStore) {
      debug("CREATE DB", dbPath, dbConfig.storage)
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
    this.initializingDatabase = database
    await database.start(this.config)
    this.initializingDatabase = undefined
    return database
  }

  async doSaveMetadata() {
    if(this.config.temporary) return
    //console.log("SAVE METADATA\n"+JSON.stringify(this.metadata, null, "  "))
    const normalMetadataPath = path.resolve(this.config.dbRoot, 'metadata.json')
    const backupMetadataPath = path.resolve(this.config.dbRoot, 'metadata.json.bak')
    this.metadata.timestamp = Date.now()
    await fs.promises.writeFile(normalMetadataPath, JSON.stringify(this.metadata, null, "  "))
    await fs.promises.writeFile(backupMetadataPath, JSON.stringify(this.metadata, null, "  "))
  }
  async saveMetadata() {
    if(this.metadataSavePromise) await this.metadataSavePromise
    this.metadataSavePromise = this.doSaveMetadata()
    await this.metadataSavePromise
  }

  async getHttp() {
    if(this.http) return this.http
    if(this.httpPromise) return this.httpPromise
    this.httpPromise = (async () => {
      const app = express()
      const sockJsServer = sockjs.createServer({ prefix: '/api/sockjs' })
      sockJsServer.on('connection', (conn) => {
        debug("SOCKJS connection")
        this.apiServer.handleConnection(conn)
      })
      const server = http.createServer(app)
      let wsServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false,
        maxReceivedFrameSize: 1024*1024, // 1 MiB
        maxReceivedMessageSize: 10*1024*1024, // 10 MiB
      })
      wsServer.on("request",(request) => {
        debug("WS URI", request.httpRequest.url, "FROM", request.remoteAddress)
        if(request.httpRequest.url !== "/api/ws") return request.reject()
        let serverConnection = new ReactiveDaoWebsocketServer(request)
        this.apiServer.handleConnection(serverConnection)
      })
      sockJsServer.attach(server)

      this.http = {
        app,
        sockJsServer,
        wsServer,
        server
      }
      return this.http
    })()
    return this.httpPromise
  }

  async listen(...args) {
    (await this.getHttp()).server.listen(...args)
  }

  async close() {
    if(this.http) {
      this.http.server.close()
    }
    for(const db of this.databaseStores.values()) db.close()
  }

  handleUnhandledRejectionInQuery(reason, promise) {
    console.error("ERROR IN USER CODE:", reason.stack)
    let rest = reason.stack
    while(true) {
      const match = rest.match(/\s(userCode:([a-z0-9_.\/-]+):([0-9]+):([0-9]+))\n/i)
      if(match) {
        const path = match[2]
        const line = match[3]
        const column = match[4]

        const pathParts = path.split('/')

        const databaseName = pathParts[0]
        const objectDir = pathParts[1]
        if(objectDir === 'query.js') {
          console.error("error in query to database", databaseName)
          return
        }
        const database = this.databases.get(databaseName)
        if(objectDir !== 'indexes') {
          console.error(`unknown object dir ${objectDir}, something is wrong, exiting...`)
          process.exit(1)
        }
        const indexName = pathParts[2]
        if(!database) {
          if(this.initializingDatabase.name !== databaseName) {
            console.error('error in non existing database?!', databaseName)
            process.exit(1)
          }
          console.error('error when initializing database', databaseName)
          this.initializingDatabase.handleUnhandledRejectionInIndex(indexName, reason, promise)
        } else {
          database.handleUnhandledRejectionInIndex(indexName, reason, promise)
        }
      } else break;
    }
  }
}

export default Server
