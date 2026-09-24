import fs from 'fs'
import lmdb from 'node-lmdb'
import { rimraf } from 'rimraf'
import Store from '../lib/Store.js'
import { runRangeObservableStressSuite } from '../../db/test-helpers/rangeObservableStress.js'

runRangeObservableStressSuite({
  label: 'lmdb',
  async makeStore(dbPath) {
    await rimraf(dbPath)
    fs.mkdirSync(dbPath, { recursive: true })
    const env = new lmdb.Env()
    env.open({
      path: dbPath,
      maxDbs: 10
    })
    const dbi = env.openDbi({
      name: 'test',
      create: true
    })
    const store = new Store(env, dbi)
    return { store, env, dbi, dbPath }
  },
  async cleanup(ctx) {
    ctx.dbi.close()
    ctx.env.close()
    await rimraf(ctx.dbPath)
  }
})
