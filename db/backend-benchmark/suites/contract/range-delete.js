export const name = 'range-delete'
export const layer = 'store'
export const capabilities = ['rangeDelete']

export async function run({ store, assert, capabilities }) {
  await store.put({ id: 'a', v: 1 })
  await store.put({ id: 'b', v: 2 })
  await store.put({ id: 'c', v: 3 })
  await store.put({ id: 'd', v: 4 })
  await store.put({ id: 'e', v: 5 })

  const withValues = await store.rangeDelete({ gte: 'a', lt: 'c' })
  assert.equal(withValues.count, 2, 'deleted a,b')
  assert.equal(await store.objectGet('a'), null, 'a gone')
  assert.equal(await store.objectGet('b'), null, 'b gone')
  assert.deepEqual(await store.objectGet('c'), { id: 'c', v: 3 }, 'c remains')

  if(capabilities.rangeDeleteKeysOnly) {
    const keysOnly = await store.rangeDelete({ gte: 'd', lt: 'f' }, { keysOnly: true })
    assert.equal(keysOnly.count, 2, 'keysOnly deleted 2')
    assert.equal(await store.objectGet('d'), null, 'd gone')
    assert.equal(await store.objectGet('e'), null, 'e gone')
  } else {
    const keysOnly = await store.rangeDelete({ gte: 'd', lt: 'f' })
    assert.equal(keysOnly.count, 2, 'deleted d,e without keysOnly option')
    assert.equal(await store.objectGet('d'), null, 'd gone')
    assert.equal(await store.objectGet('e'), null, 'e gone')
  }
}
