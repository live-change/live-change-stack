import { padId } from '../../lib/assert.js'

export const name = 'paginated-put'
export const layer = 'store'

export async function run({ store, assert, size }) {
  const n = Math.min(Math.max(size, 1000), 50000)
  for(let i = 0; i < n; i++) {
    await store.put({ id: padId(i), v: i })
  }
  let count = 0
  let last = ''
  while(true) {
    const batch = await store.rangeGet({ gt: last, limit: 256 })
    if(!batch.length) break
    count += batch.length
    last = batch[batch.length - 1].id
  }
  assert.equal(count, n, 'paginated range reads all rows')
}
