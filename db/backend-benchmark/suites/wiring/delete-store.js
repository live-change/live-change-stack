export const name = 'delete-store'
export const layer = 'store'

export async function run({ session, store, assert }) {
  await store.put({ id: 'a', v: 1 })
  await session.deleteStore('data')
  const again = session.createStore('data')
  const got = await again.objectGet('a')
  assert.equal(got, null, 'store deleted, key gone')
}
