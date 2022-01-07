function createBackend(config) {
  if(config.backend == 'mem') {
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
        await rimraf(db.path)
      },
      createStore(db, name, options) {
        return new this.Store()
      },
      closeStore(store) {
      },
      async deleteStore(store) {
        await store.clear()
      }
    }
  } else throw new Error("Unknown backend " + config.backend)
}

module.exports = createBackend
