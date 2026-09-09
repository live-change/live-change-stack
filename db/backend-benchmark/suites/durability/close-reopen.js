import { padId } from '../../lib/assert.js'

export const name = 'close-reopen'
export const layer = 'store'
export const capabilities = ['durable']

export async function run({ session, store, assert, size }) {
  const n = Math.min(size, 200)
  for(let i = 0; i < n; i++) {
    await store.put({ id: padId(i), v: i })
  }
  await session.closeDbOnly()
  await session.reopen()
  const again = session.createStore('data')
  const ids = []
  let last = ''
  while(true) {
    const batch = await again.rangeGet({ gt: last, limit: 64 })
    if(!batch.length) break
    for(const row of batch) ids.push(row.id)
    last = batch[batch.length - 1].id
  }
  assert.equal(ids.length, n, 'all rows survived close/reopen')
}
