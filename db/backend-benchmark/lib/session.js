import fs from 'fs'
import path from 'path'
import createBackend from '@live-change/db-server/lib/backend.js'
import { Database } from '@live-change/db'
import ScriptContext from '@live-change/db/lib/ScriptContext.js'

export class Session {
  constructor({ backendName, tmpDir, maxDbs = 1024, mapSize }) {
    this.backendName = backendName
    this.tmpDir = tmpDir
    this.backend = createBackend({
      name: backendName,
      maxDbs,
      mapSize
    })
    this.db = null
    this.stores = new Map()
    this.closed = false
  }

  open() {
    fs.mkdirSync(this.tmpDir, { recursive: true })
    this.db = this.backend.createDb(this.tmpDir)
    this.closed = false
    return this
  }

  createStore(name, options = {}) {
    const store = this.backend.createStore(this.db, name, options)
    this.stores.set(name, store)
    return store
  }

  getStore(name) {
    return this.stores.get(name)
  }

  async deleteStore(name) {
    let store = this.stores.get(name)
    if(!store) store = this.backend.createStore(this.db, name)
    await this.backend.deleteStore(store)
    this.stores.delete(name)
  }

  createDatabase(dbName = 'bench') {
    return new Database(
      {},
      (name, config) => this.createStore(name, config),
      () => {},
      (name) => this.deleteStore(name),
      dbName,
      (context) => new ScriptContext(context)
    )
  }

  async closeDbOnly() {
    for(const store of this.stores.values()) {
      try {
        await this.backend.closeStore(store)
      } catch(e) {}
    }
    this.stores.clear()
    if(this.db) {
      const db = this.db
      this.db = null
      try {
        const closed = this.backend.closeDb(db)
        if(closed && typeof closed.then === 'function') await closed
      } catch(e) {}
      if(typeof db.once === 'function') {
        await new Promise(resolve => {
          const t = setTimeout(resolve, 2000)
          try {
            db.once('closed', () => {
              clearTimeout(t)
              resolve()
            })
          } catch(e) {
            clearTimeout(t)
            resolve()
          }
        })
      }
    }
    this.closed = true
  }

  async reopen() {
    this.db = this.backend.createDb(this.tmpDir)
    this.closed = false
    return this
  }

  async close({ keep = false } = {}) {
    if(this.closed && !this.db) {
      if(!keep) await this.removeDir()
      return
    }
    for(const store of this.stores.values()) {
      try {
        await this.backend.closeStore(store)
      } catch(e) {}
    }
    this.stores.clear()
    if(this.db) {
      try {
        if(keep) {
          const closed = this.backend.closeDb(this.db)
          if(closed && typeof closed.then === 'function') await closed
        } else await this.backend.deleteDb(this.db)
      } catch(e) {
        try {
          const closed = this.backend.closeDb(this.db)
          if(closed && typeof closed.then === 'function') await closed
        } catch(e2) {}
        if(!keep) await this.removeDir()
      }
    }
    this.db = null
    this.closed = true
    if(!keep) await this.removeDir()
  }

  async removeDir() {
    try {
      fs.rmSync(this.tmpDir, { recursive: true, force: true })
    } catch(e) {}
  }
}

export function sessionTmpDir(root, backendName, suiteId, pid) {
  return path.join(root, 'tmp', backendName + '-' + suiteId.replace(/\//g, '_') + '-' + pid)
}
