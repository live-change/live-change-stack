import levelup from 'levelup'
import leveldown from 'leveldown'
import subleveldown from 'subleveldown'

import Store from '@live-change/db-store-level'

const levels = new Map()

export default function(dbPath, name) {
  let level = levels.get(dbPath)
  if(!level) {
    level = levelup(leveldown(dbPath))
    levels.set(dbPath, level)
  }
  const store = new Store(subleveldown(level, name, { keyEncoding: 'ascii', valueEncoding: 'json' }))
  store.close = async function() {
    await new Promise((resolve, reject) => {
      level.createReadStream({ keys: true, values: true }).on('data', function ({ key, value }) {
        //console.log("key:", key.toString('ascii') )
        //console.log("value:", value.toString('ascii') )
      })
      .on('error', function (err) {
        reject(err)
      })
      .on('close', function () {
      })
      .on('end', ()=> resolve('readed'))
    })
    await level.close()
  }
  return store
}
