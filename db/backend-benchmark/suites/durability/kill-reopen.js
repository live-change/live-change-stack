import fs from 'fs'
import path from 'path'
import { padId } from '../../lib/assert.js'

export const name = 'kill-reopen'
export const layer = 'store'
export const capabilities = ['durable']
export const protocol = 'write-kill-reopen'

export async function write({ store, tmpDir, size }) {
  const n = Math.min(size, 200)
  for(let i = 0; i < n; i++) {
    await store.put({ id: padId(i), v: i })
  }
  fs.writeFileSync(path.join(tmpDir, 'written.json'), JSON.stringify({ n }))
}

export async function verify({ store, tmpDir, assert }) {
  const meta = JSON.parse(fs.readFileSync(path.join(tmpDir, 'written.json'), 'utf8'))
  const ids = []
  let last = ''
  try {
    while(true) {
      const batch = await store.rangeGet({ gt: last, limit: 64 })
      if(!batch.length) break
      for(const row of batch) {
        if(typeof row.v !== 'number' || typeof row.id !== 'string') {
          throw new Error('corrupt-or-crash: bad object ' + JSON.stringify(row))
        }
        ids.push(row.id)
      }
      last = batch[batch.length - 1].id
    }
  } catch(err) {
    if(String(err.message).startsWith('corrupt-or-crash')) throw err
    throw new Error('corrupt-or-crash: ' + err.message)
  }
  assert.ok(ids.length > 0, 'recovered some rows after SIGKILL')
  assert.ok(ids.length <= meta.n, 'not more rows than written')
}
