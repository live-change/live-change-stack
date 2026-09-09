import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { rimraf } from "rimraf"
import lmdb from 'node-lmdb'
import lmdbStore from'@live-change/db-store-lmdb'
import rbTreeStore from'@live-change/db-store-rbtree'
import levelStore from '@live-change/db-store-level'
import rocksStore from '@live-change/db-store-rocksdb'
import sqliteStore, { applyPragmas } from '@live-change/db-store-sqlite'
import Debug from 'debug'

const require = createRequire(import.meta.url)
const debugPut = Debug('db:profilePut')

const unavailableEnvStat = () => ({ available: false })

function dirFileStat(dir) {
  if(!dir || !fs.existsSync(dir)) return unavailableEnvStat()
  let apparent = 0
  let allocated = 0
  let fileCount = 0
  function walk(d) {
    let entries
    try {
      entries = fs.readdirSync(d, { withFileTypes: true })
    } catch(e) {
      return
    }
    for(const entry of entries) {
      const full = path.join(d, entry.name)
      if(entry.isDirectory()) walk(full)
      else {
        try {
          const st = fs.statSync(full)
          fileCount++
          apparent += st.size
          allocated += (st.blocks || 0) * 512
        } catch(e) {}
      }
    }
  }
  walk(dir)
  if(!fileCount) return unavailableEnvStat()
  return {
    available: true,
    fileBytes: apparent,
    apparentFileBytes: apparent,
    allocatedFileBytes: allocated || apparent
  }
}

function openDown(Down, dbPath, options) {
  // rocksdb/leveldown createIfMissing mkdir is not recursive — parent of
  // dbRoot/<name>.db must exist, same as lmdb/sqlite createDb.
  fs.mkdirSync(dbPath, { recursive: true })
  const db = Down(dbPath)
  db.path = dbPath
  db._opened = new Promise((resolve, reject) => {
    db.open({ createIfMissing: true, ...(options || {}) }, err => {
      if(err) reject(err)
      else resolve()
    })
  })
  return db
}

function closeDown(db) {
  return new Promise((resolve, reject) => {
    if(!db || typeof db.close !== 'function') return resolve()
    db.close(err => err ? reject(err) : resolve())
  })
}

function createDownBackend(Store, Down) {
  return {
    Store,
    Down,
    createDb(dbPath, options) {
      return openDown(this.Down, dbPath, options)
    },
    closeDb(db) {
      return closeDown(db)
    },
    async deleteDb(db) {
      await closeDown(db)
      if(db && db.path) await rimraf(db.path)
    },
    createStore(db, name, options) {
      return new this.Store(db, { ...options, prefix: name + '\x00' })
    },
    closeStore(store) {
    },
    async deleteStore(store) {
      await store.clear()
    },
    envStat(db) {
      return dirFileStat(db && db.path)
    }
  }
}

function createBackend({ name, url, maxDbs, mapSize }) {
  if(name == 'leveldb') {
    return createDownBackend(levelStore, require('leveldown'))
  } else if(name == 'rocksdb') {
    return createDownBackend(rocksStore, require('rocksdb'))
  } else if(name == 'memdown') {
    return createDownBackend(levelStore, require('memdown'))
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
        env.openConfig = envConfig
        if(debugPut.enabled) {
          let info = null
          let stat = null
          let file = null
          try { info = env.info() } catch(e) { info = { error: String(e) } }
          try { stat = env.stat() } catch(e) { stat = { error: String(e) } }
          try {
            const st = fs.statSync(path.join(dbPath, 'data.mdb'))
            file = { size: st.size, blocks: st.blocks, allocatedBytes: st.blocks * 512 }
          } catch(e) {
            file = { error: String(e) }
          }
          debugPut(
            'env.open path=%s openConfig=%o env.info=%o env.stat=%o data.mdb=%o',
            dbPath,
            envConfig,
            info,
            stat,
            file
          )
        }
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
            }), { ...options, name })
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
  } else if(name == 'sqlite') {
    const Database = require('better-sqlite3')
    return {
      Store: sqliteStore,
      Database,
      createDb(dbPath, options) {
        fs.mkdirSync(dbPath, { recursive: true })
        const db = new Database(path.join(dbPath, 'data.sqlite'))
        applyPragmas(db, { mapSize, ...options })
        db.path = dbPath
        return db
      },
      closeDb(db) {
        if(db && db.open) db.close()
      },
      async deleteDb(db) {
        if(db) {
          try {
            if(db.open) db.close()
          } catch(e) {}
          if(db.path) await rimraf(db.path)
        }
      },
      createStore(db, name, options) {
        return new this.Store(db, { ...options, name })
      },
      closeStore(store) {
      },
      async deleteStore(store) {
        store.drop()
      },
      envStat(db) {
        if(!db || typeof db.pragma !== 'function') return unavailableEnvStat()
        const pageCount = db.pragma('page_count', { simple: true })
        const pageSize = db.pragma('page_size', { simple: true })
        const freelistCount = db.pragma('freelist_count', { simple: true })
        const journalMode = db.pragma('journal_mode', { simple: true })
        return {
          available: true,
          pageCount,
          pageSize,
          freelistCount,
          journalMode,
          fileBytes: pageCount * pageSize
        }
      }
    }
  } else throw new Error("Unknown backend " + name)
}

export default createBackend
