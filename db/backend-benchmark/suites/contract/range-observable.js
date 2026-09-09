import { watchObservable, delay } from '../../lib/assert.js'

export const name = 'range-observable'
export const layer = 'store'

export async function run({ store, assert }) {
  await store.put({ v: 1, id: 'a' })
  await store.put({ v: 3, id: 'c' })

  const full = store.rangeObservable({ gte: 'a', lte: 'z' })
  const watchFull = watchObservable(full, () => full.list.slice())
  try {
    assert.deepEqual(await watchFull.next(), [{ v: 1, id: 'a' }, { v: 3, id: 'c' }], 'initial [a,z]')

    await store.delete('a')
    assert.deepEqual(await watchFull.next(), [{ v: 3, id: 'c' }], 'delete a')

    await store.put({ id: 'a', v: 4 })
    assert.deepEqual(await watchFull.next(), [{ id: 'a', v: 4 }, { v: 3, id: 'c' }], 'put a')

    await store.put({ id: 'b', v: 5 })
    assert.deepEqual(
      await watchFull.next(),
      [{ id: 'a', v: 4 }, { id: 'b', v: 5 }, { v: 3, id: 'c' }],
      'put b'
    )

    await store.put({ id: 'd', v: 6 })
    assert.deepEqual(
      await watchFull.next(),
      [{ id: 'a', v: 4 }, { id: 'b', v: 5 }, { v: 3, id: 'c' }, { id: 'd', v: 6 }],
      'put d'
    )
  } finally {
    watchFull.stop()
  }

  const inner = store.rangeObservable({ gt: 'a', lt: 'd' })
  const watchInner = watchObservable(inner, () => inner.list.slice())
  try {
    assert.deepEqual(
      await watchInner.next(),
      [{ id: 'b', v: 5 }, { v: 3, id: 'c' }],
      'initial (a,d)'
    )

    await store.delete('d')
    await store.delete('a')
    await delay(40)
    assert.equal(watchInner.pending(), 0, 'outside range does not notify')

    await store.put({ id: 'ab', v: 7 })
    assert.deepEqual(
      await watchInner.next(),
      [{ id: 'ab', v: 7 }, { id: 'b', v: 5 }, { v: 3, id: 'c' }],
      'put ab inside'
    )

    await store.delete('ab')
    assert.deepEqual(
      await watchInner.next(),
      [{ id: 'b', v: 5 }, { v: 3, id: 'c' }],
      'delete ab'
    )
  } finally {
    watchInner.stop()
  }
}
