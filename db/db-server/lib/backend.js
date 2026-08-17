import fs from 'fs'
import path from 'path'
import { rimraf } from "rimraf"
import lmdb from 'node-lmdb'
import lmdbStore from'@live-change/db-store-lmdb'
import rbTreeStore from'@live-change/db-store-rbtree'

const unavailableEnvStat = () => ({ available: false })

function createBackend({ name, url, maxDbs, mapSize }) {
  if(name == 'leveldb') {
    return {
      levelup: require('levelup'),
      leveldown: require('leveldown'),
      subleveldown: require('subleveldown'),
      encoding: require('encoding-down'),
      Store: require('@live-change/db-store-level'),
      createDb(path, options) {
        const db = this.levelup(this.leveldown(path, options), options)
        db.path = path
        return db
      },
      closeDb(db) {
        db.close()
      },
      async deleteDb(db) {
        db.close()
        await rimraf(db.path)
      },
      createStore(db, name, options) {
        return new this.Store(this.subleveldown(db, name,
            { ...options, keyEncoding: 'ascii', valueEncoding: 'json' }))
      },
      closeStore(store) {
      },
      async deleteStore(store) {
        await store.clear()
      },
      envStat: unavailableEnvStat
    }
  } else if(name == 'rocksdb') {
    return {
      levelup: require('levelup'),
      rocksdb: require('level-rocksdb'),
      subleveldown: require('subleveldown'),
      encoding: require('encoding-down'),
      Store: require('@live-change/db-store-level'),
      createDb(path, options) {
        const db = this.levelup(this.rocksdb(path, options), options)
        db.path = path
        return db
      },
      closeDb(db) {
        db.close()
      },
      async deleteDb(db) {
        db.close()
        await rimraf(db.path)
      },
      createStore(db, name, options) {
        return new this.Store(this.subleveldown(db, name,
            { ...options, keyEncoding: 'ascii', valueEncoding: 'json' }))
      },
      closeStore(store) {
      },
      async deleteStore(store) {
        await store.clear()
      },
      envStat: unavailableEnvStat
    }
  } else if(name == 'memdown') {
    return {
      levelup: require('levelup'),
      memdown: require('memdown'),
      subleveldown: require('subleveldown'),
      encoding: require('encoding-down'),
      Store: require('@live-change/db-store-level'),
      createDb(path, options) {
        const db = this.levelup(this.memdown(path, options), options)
        db.path = path
        return db
      },
      closeDb(db) {
        db.close()
      },
      async deleteDb(db) {
        db.close()
        await rimraf(db.path)
      },
      createStore(db, name, options) {
        return new this.Store(this.subleveldown(db, name,
            { ...options, keyEncoding: 'ascii', valueEncoding: 'json' }))
      },
      closeStore(store) {
      },
      async deleteStore(store) {
        await store.clear()
      },
      envStat: unavailableEnvStat
    }
  } else if(name == 'mem' || name == 'memory') {
    return {
      Store: rbTreeStore,
      createDb(path, options) {
        const db = {}
        db.path = path
        return db
      },
      closeDb(db) {
      },
      async deleteDb(db) {
      },
      createStore(db, name, options) {
        return new this.Store(options)
      },
      closeStore(store) {
      },
      async deleteStore(store) {
      },
      envStat: unavailableEnvStat
    }
  } else if(name == 'lmdb') {
    return {
      lmdb,
      Store: lmdbStore,
      createDb(dbPath, options) {
        fs.mkdirSync(dbPath, { recursive: true })
        const env = new this.lmdb.Env()
        const envConfig = {
          path: dbPath,
          maxDbs: maxDbs || 1024,
          mapSize: mapSize || (200 * 1024 * 1024 * 1024),
          ...options
        }
        env.open(envConfig)
        env.path = dbPath
        return env
      },
      closeDb(db) {
        db.close()
      },
      async deleteDb(db) {
        db.close()
        await rimraf(db.path)
      },
      createStore(db, name, options) {
        return new this.Store(db,
            db.openDbi({
              name,
              create: true
            }), options)
      },
      closeStore(store) {
        store.lmdb.close()
      },
      async deleteStore(store) {
        store.lmdb.drop()
      },
      envStat(env) {
        if(!env || typeof env.info !== 'function') return unavailableEnvStat()
        const info = env.info()
        const stat = env.stat()
        const pageSize = stat.pageSize
        const fileBytes = (info.lastPageNumber + 1) * pageSize
        let apparentFileBytes = null
        let allocatedFileBytes = null
        try {
          const st = fs.statSync(path.join(env.path, 'data.mdb'))
          apparentFileBytes = st.size
          allocatedFileBytes = st.blocks * 512
        } catch(e) {
          // file may not exist yet
        }
        return {
          available: true,
          mapSize: info.mapSize,
          lastPageNumber: info.lastPageNumber,
          lastTxnId: info.lastTxnId,
          pageSize,
          fileBytes,
          apparentFileBytes,
          allocatedFileBytes,
          numReaders: info.numReaders,
          maxReaders: info.maxReaders
        }
      }
    }
  } else if(name == 'observabledb') {
    const Store = require('@live-change/db-store-observable-db')
    const connection = new Store.Connection(url || 'ws://localhost:3530/api/ws')
    return {
      Store,
      connection,
      createDb(path, options) {
        const pathSep = path.lastIndexOf('/')
        const dbName = path.slice(pathSep > 0 ? pathSep+1 : 0)
        console.log("CREATE DATABASE!", dbName, options)
        const openPromise = connection.createDatabase(dbName, options || {}).then(ok=>{
          console.log("database", dbName, "created")
        }).catch(err => {
          if(err == 'exists') console.log("database", dbName, "already exists")
            else console.error("CREATE DB ERROR", err)
        })
        return dbName
      },
      closeDb(db) {
        /// remote database - ignore
      },
      async deleteDb(db) {
        return connection.deleteDatabase(db)
      },
      createStore(db, name, options) {
        console.log("CREATE STORE", db, name)
        connection.createStore(db, name, options || {}).then(ok=>{
          console.log("database", db, "store", name, "created")
        }).catch(err => {
          if(err == 'exists') console.log("database", db, "store", name, "already exists")
            else console.error("CREATE STORE ERROR", err)
        })
        return new Store(connection, db, name, options)
      },
      closeStore(store) {
        return store.close()
      },
      deleteStore(store) {
        return connection.deleteStore(store.databaseName, store.storeName)
      },
      envStat: unavailableEnvStat
    }
  } else throw new Error("Unknown backend " + name)
}

export default createBackend
