import localStorageStore from '@live-change/db-store-localstorage'
import indexedDbStore from '@live-change/db-store-indexeddb'
import rbTreeStore from '@live-change/db-store-rbtree'

function createBackend(config) {
  console.log("CREATE BACKEND", config)
  if(config.name == 'mem' || config.name == 'memory') {
    return {
      Store: rbTreeStore,
      createDb(path, options) {
        const db = {}
        db.path = path
        return db
      },
      closeDb(db) {
        db.close()
      },
      async deleteDb(db) {
        db.close()
      },
      createStore(db, name, options) {
        return new this.Store(options)
      },
      closeStore(store) {
      },
      async deleteStore(store) {
      }
    }
  } if(config.name == 'indexeddb') {
    return {
      Store: indexedDbStore,
      createDb(path, options) {
        const db = {}
        db.path = path
        return db
      },
      closeDb(db) {
        db.close()
      },
      async deleteDb(db) {
        db.close()
        db.deleteDb()
      },
      createStore(db, name, options) {
        return new this.Store(db.path, name, options)
      },
      closeStore(store) {
      },
      async deleteStore(store) {
        await store.clear()
      }
    }
  } if(config.name == 'local') {
    return {
      Store: localStorageStore,
      createDb(path, options) {
        const db = {}
        db.path = path
        return db
      },
      closeDb(db) {
        db.close()
      },
      async deleteDb(db) {
        db.close()
        db.deleteDb()
      },
      createStore(db, name, options) {
        return new this.Store(db.path, name, 'local', options)
      },
      closeStore(store) {
      },
      async deleteStore(store) {
        await store.clear()
      }
    }
  } if(config.name == 'session') {
    return {
      Store: localStorageStore,
      createDb(path, options) {
        const db = {}
        db.path = path
        return db
      },
      closeDb(db) {
        db.close()
      },
      async deleteDb(db) {
        db.close()
        db.deleteDb()
      },
      createStore(db, name, options) {
        return new this.Store(db.path, name, 'session', options)
      },
      closeStore(store) {
      },
      async deleteStore(store) {
        await store.clear()
      }
    }
  } else {
    throw new Error("Unknown backend " + config.name)
  }
}

export default createBackend
