export const name = 'read-your-writes'
export const layer = 'store'

export async function run({ store, assert }) {
  await store.put({ id: 'k1', v: 1 })
  assert.deepEqual(await store.objectGet('k1'), { id: 'k1', v: 1 }, 'get sees put')
  const range = await store.rangeGet({ gte: 'k', lte: 'l', limit: 16 })
  assert.equal(range.length, 1, 'range sees put')
  assert.equal(range[0].id, 'k1', 'range id')
}
