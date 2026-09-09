export const name = 'put-roundtrip'
export const layer = 'store'

export async function run({ store, assert }) {
  await store.put({ id: 'a', v: 1 })
  const got = await store.objectGet('a')
  assert.deepEqual(got, { id: 'a', v: 1 }, 'put/get roundtrip')
}
