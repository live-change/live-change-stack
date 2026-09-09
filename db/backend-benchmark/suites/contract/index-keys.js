export const name = 'index-keys'
export const layer = 'store'

export async function run({ store, assert }) {
  const parts = ['user', 'abc']
  const prefix = parts.map(v => JSON.stringify(v)).join(':')
  await store.put({ id: prefix + ':' + JSON.stringify('1'), to: '1' })
  await store.put({ id: prefix + ':' + JSON.stringify('2'), to: '2' })
  await store.put({ id: JSON.stringify('other') + ':x', to: 'x' })

  const range = await store.rangeGet({
    gte: prefix + ':',
    lte: prefix + '_\xFF\xFF\xFF\xFF'
  })
  assert.equal(range.length, 2, 'prefix range returns 2')
  assert.ok(range.every(row => row.id.startsWith(prefix + ':')), 'ids share prefix')

  await store.put({ id: '\x00first', v: 0 })
  await store.put({ id: ':colon', v: 1 })
  await store.put({ id: '_under', v: 2 })
  const ordered = await store.rangeGet({ gte: '\x00', lte: 'z', limit: 32 })
  const ids = ordered.map(o => o.id)
  const sorted = [...ids].sort()
  assert.deepEqual(ids, sorted, 'lexicographic order matches JS string sort')
}
