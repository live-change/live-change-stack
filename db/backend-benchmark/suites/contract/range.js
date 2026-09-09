export const name = 'range'
export const layer = 'store'

export async function run({ store, assert }) {
  await store.put({ id: 'a', v: 1 })
  await store.put({ id: 'c', v: 3 })
  await store.put({ id: 'b', v: 2 })

  assert.deepEqual(
    await store.rangeGet({ gte: 'a', lte: 'c' }),
    [{ v: 1, id: 'a' }, { v: 2, id: 'b' }, { v: 3, id: 'c' }],
    'range [a,c]'
  )
  assert.deepEqual(
    await store.rangeGet({ gte: 'a', lte: 'c', reverse: true }),
    [{ v: 3, id: 'c' }, { v: 2, id: 'b' }, { v: 1, id: 'a' }],
    'reverse [c,a]'
  )
  assert.deepEqual(
    await store.rangeGet({ gte: 'a', lte: 'c', limit: 2 }),
    [{ v: 1, id: 'a' }, { v: 2, id: 'b' }],
    'limit 2'
  )
  assert.deepEqual(
    await store.rangeGet({ gte: 'a', lte: 'c', reverse: true, limit: 2 }),
    [{ v: 3, id: 'c' }, { v: 2, id: 'b' }],
    'reverse limit 2'
  )
  assert.deepEqual(
    await store.rangeGet({ gt: 'a', lte: 'c' }),
    [{ v: 2, id: 'b' }, { v: 3, id: 'c' }],
    'range (a,c]'
  )
  assert.deepEqual(
    await store.rangeGet({ gt: 'a', lte: 'c', reverse: true }),
    [{ v: 3, id: 'c' }, { v: 2, id: 'b' }],
    'reverse (a,c]'
  )
  assert.deepEqual(
    await store.rangeGet({ gte: 'a', lt: 'c' }),
    [{ v: 1, id: 'a' }, { v: 2, id: 'b' }],
    'range [a,c)'
  )
  assert.deepEqual(
    await store.rangeGet({ gte: 'a', lt: 'c', reverse: true }),
    [{ v: 2, id: 'b' }, { v: 1, id: 'a' }],
    'reverse [a,c)'
  )
  assert.deepEqual(
    await store.rangeGet({ gt: 'a', lt: 'c' }),
    [{ v: 2, id: 'b' }],
    'range (a,c)'
  )
  assert.deepEqual(
    await store.rangeGet({ gt: 'a', lt: 'c', reverse: true }),
    [{ v: 2, id: 'b' }],
    'reverse (a,c)'
  )

  await store.delete('b')
  assert.deepEqual(
    await store.rangeGet({ gte: 'a', lte: 'c' }),
    [{ v: 1, id: 'a' }, { v: 3, id: 'c' }],
    'range after delete b'
  )
}
