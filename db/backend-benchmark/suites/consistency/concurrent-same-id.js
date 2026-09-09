export const name = 'concurrent-same-id'
export const layer = 'store'

export async function run({ store, assert }) {
  const n = 32
  await Promise.all(Array.from({ length: n }, (_, i) => store.put({ id: 'hot', v: i })))
  const got = await store.objectGet('hot')
  assert.ok(got && got.id === 'hot', 'object readable')
  assert.ok(typeof got.v === 'number' && got.v >= 0 && got.v < n, 'value is one of the writes')
  JSON.stringify(got)
}
