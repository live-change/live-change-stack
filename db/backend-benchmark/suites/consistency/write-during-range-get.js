import { padId } from '../../lib/assert.js'

export const name = 'write-during-range-get'
export const layer = 'store'

export async function run({ store, assert }) {
  for(let i = 0; i < 40; i++) {
    await store.put({ id: padId(i), v: i })
  }
  const reads = []
  const writes = []
  for(let i = 0; i < 8; i++) {
    reads.push(store.rangeGet({ gte: padId(0), lte: padId(39), limit: 40 }))
    writes.push(store.put({ id: padId(10 + i), v: 1000 + i }))
  }
  const results = await Promise.all(reads)
  await Promise.all(writes)
  for(const batch of results) {
    assert.ok(Array.isArray(batch), 'rangeGet returned array')
    assert.ok(batch.length > 0, 'rangeGet not empty')
    for(const row of batch) {
      assert.ok(row && typeof row.id === 'string', 'row has id')
    }
  }
}
