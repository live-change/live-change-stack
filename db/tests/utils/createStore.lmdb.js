import lmdb from 'node-lmdb'
import fs from 'fs'

import Store from '@live-change/db-store-lmdb'

const envs = new Map()

export default  function(dbPath, name) {
  let env = envs.get(dbPath)
  if(!env) {
    fs.mkdirSync(dbPath)
    env = new lmdb.Env();
    env.open({
      path: dbPath,
      maxDbs: 20
    })
    envs.set(dbPath, env)
  }

  const dbi = env.openDbi({
    name,
    create: true
  })

  const store = new Store(env, dbi)
  store.close = async function() {
    if(envs.has(dbPath)) {
      envs.get(dbPath).close()
      envs.delete(dbPath)
    }
  }
  return store
}
