import { padId } from '../../lib/assert.js'

export const name = 'range-delete-vs-put'
export const layer = 'store'
export const capabilities = ['rangeDelete']

export async function run({ store, assert }) {
  for(let i = 0; i < 80; i++) {
    await store.put({ id: padId(i), v: i })
  }
  const deletes = []
  const puts = []
  for(let i = 0; i < 10; i++) {
    deletes.push(store.rangeDelete({ gte: padId(10), lt: padId(40), limit: 8 }))
    puts.push(store.put({ id: padId(15 + i), v: 1000 + i }))
  }
  await Promise.all([...deletes, ...puts])
  const batch = await store.rangeGet({ gte: padId(0), lte: padId(79), limit: 80 })
  assert.ok(Array.isArray(batch), 'store readable after overlapping delete/put')
  for(const row of batch) {
    assert.ok(row && typeof row.id === 'string', 'valid row')
  }
}
