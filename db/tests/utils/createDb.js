import { rimrafSync } from "rimraf"

import Database from "../../lib/Database.js"
import createStoreLevel from "./createStore.level.js"
import createStoreLmdb from "./createStore.lmdb.js"

function createDb(dbPath) {
  rimrafSync(dbPath)
  const db = new Database({}, (name, config) => {
    let store
    if(process.env.DB=='level') {
      store = createStoreLmdb(dbPath, name)
    } else if(process.env.DB=='lmdb' || !process.env.DB) {
      store = createStoreLevel(dbPath, name)
    } else {
      console.error("Unknown database " + process.env.DB)
      throw new Error("Unknown database " + process.env.DB)
    }
    const oldClose = db.close
    db.close = async () => {
      if(oldClose) oldClose.call(db)
      await store.close()
    }
    return store
  })
  return db
}

export default createDb
