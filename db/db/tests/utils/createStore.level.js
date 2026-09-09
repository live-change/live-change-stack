import { createRequire } from 'module'
import Store from '@live-change/db-store-level'

const require = createRequire(import.meta.url)
const leveldown = require('leveldown')

const downs = new Map()

function openDown(dbPath) {
  let down = downs.get(dbPath)
  if(down) return down
  down = leveldown(dbPath)
  down.path = dbPath
  down._opened = new Promise((resolve, reject) => {
    down.open({ createIfMissing: true }, err => err ? reject(err) : resolve())
  })
  downs.set(dbPath, down)
  return down
}

export default function(dbPath, name) {
  const down = openDown(dbPath)
  const store = new Store(down, { prefix: name + '\x00' })
  store.close = async function() {
    await down._opened
    await new Promise((resolve, reject) => {
      down.close(err => err ? reject(err) : resolve())
    })
    downs.delete(dbPath)
  }
  return store
}
