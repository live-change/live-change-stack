export const name = 'count'
export const layer = 'store'
export const capabilities = ['countGet']

export async function run({ store, assert }) {
  await store.put({ id: 'a', v: 1 })
  await store.put({ id: 'c', v: 3 })
  await store.put({ id: 'b', v: 2 })

  assert.equal(await store.countGet({ gte: 'a', lte: 'c' }), 3, 'count [a,c]')
  assert.equal(await store.countGet({ gte: 'a', lte: 'c', reverse: true }), 3, 'count reverse')
  assert.equal(await store.countGet({ gte: 'a', lte: 'c', limit: 2 }), 2, 'count limit 2')
  assert.equal(await store.countGet({ gte: 'a', lte: 'c', reverse: true, limit: 2 }), 2, 'count reverse limit 2')
}
