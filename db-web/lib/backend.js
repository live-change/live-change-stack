function createBackend(config) {
  console.log("CREATE BACKEND", config)
  if(config.name == 'mem' || config.name == 'memory') {
    return {
      Store: require('@live-change/db-store-rbtree'),
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
        await store.clear()
      }
    }
  } if(config.name == 'indexeddb') {
    return {
      Store: require('@live-change/db-store-indexeddb'),
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
      Store: require('@live-change/db-store-localstorage'),
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
      Store: require('@live-change/db-store-localstorage'),
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

module.exports = createBackend
