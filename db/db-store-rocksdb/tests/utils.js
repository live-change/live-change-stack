import { createRequire } from 'module'
import { rimraf } from 'rimraf'

const require = createRequire(import.meta.url)
const rocksdb = require('rocksdb')

export async function openTestDown(dbPath) {
  await rimraf(dbPath)
  const down = rocksdb(dbPath)
  await new Promise((resolve, reject) => {
    down.open({ createIfMissing: true }, err => err ? reject(err) : resolve())
  })
  return down
}

export async function closeTestDown(down, dbPath) {
  await new Promise((resolve, reject) => {
    down.close(err => err ? reject(err) : resolve())
  })
  await rimraf(dbPath)
}
