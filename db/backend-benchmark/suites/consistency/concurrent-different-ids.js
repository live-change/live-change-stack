import { padId } from '../../lib/assert.js'

export const name = 'concurrent-different-ids'
export const layer = 'store'

export async function run({ store, assert }) {
  const n = 64
  await Promise.all(Array.from({ length: n }, (_, i) => store.put({ id: padId(i), v: i })))
  const ids = new Set()
  let last = ''
  while(true) {
    const batch = await store.rangeGet({ gt: last, limit: 32 })
    if(!batch.length) break
    for(const row of batch) ids.add(row.id)
    last = batch[batch.length - 1].id
  }
  assert.equal(ids.size, n, 'all ids present')
}
