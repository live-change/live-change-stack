export const name = 'point'
export const layer = 'store'

export async function run({ store, assert }) {
  const old1 = await store.put({ id: 'a', v: 1 })
  assert.equal(old1, null, 'first put returns null oldObject')

  const got = await store.objectGet('a')
  assert.deepEqual(got, { id: 'a', v: 1 }, 'get after put')

  const old2 = await store.put({ id: 'a', v: 2 })
  assert.deepEqual(old2, { id: 'a', v: 1 }, 'second put returns previous object')
  assert.deepEqual(await store.objectGet('a'), { id: 'a', v: 2 }, 'get overwritten value')

  const deleted = await store.delete('a')
  assert.deepEqual(deleted, { id: 'a', v: 2 }, 'delete returns object')
  assert.equal(await store.objectGet('a'), null, 'get after delete')

  const missing = await store.delete('no-such')
  assert.equal(missing, null, 'delete missing returns null')

  await assert.throws(() => store.put({ id: '', v: 1 }), 'empty id throws')
  await assert.throws(() => store.put({ id: 1, v: 1 }), 'non-string id throws')
}
