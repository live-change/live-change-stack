import { watchObservable } from '../../lib/assert.js'

export const name = 'limited-range-observable'
export const layer = 'store'

export async function run({ store, assert }) {
  const objects = []
  await store.put({ id: 'a_0', v: 1 })
  for(let i = 0; i < 10; i++) {
    const obj = { id: 'b_' + i, v: i }
    objects.push(obj)
    await store.put(obj)
  }
  await store.put({ id: 'c_0', v: 1 })

  const range = store.rangeObservable({ gte: 'b_0', lte: 'b_9', limit: 5 })
  const watch = watchObservable(range, () => range.list.slice())
  try {
    assert.deepEqual(await watch.next(), objects.slice(0, 5), 'initial limited range')

    await store.delete('b_3')
    objects.splice(3, 1)
    await watch.next()
    assert.deepEqual(await watch.next(), objects.slice(0, 5), 'refill after delete')

    const restored = { id: 'b_3', v: 10 }
    await store.put(restored)
    objects.splice(3, 0, restored)
    assert.deepEqual(await watch.next(), objects.slice(0, 5), 'put b_3 back')

    const extra = { id: 'b_32', v: 11 }
    await store.put(extra)
    objects.splice(4, 0, extra)
    assert.deepEqual(await watch.next(), objects.slice(0, 5), 'put b_32 inside window')

    const outside = { id: 'b_5', v: 11 }
    await store.put(outside)
    objects.splice(6, 0, outside)

    await store.delete('b_32')
    objects.splice(4, 1)
    await watch.next()
    assert.deepEqual(await watch.next(), objects.slice(0, 5), 'delete b_32 refills')
  } finally {
    watch.stop()
  }
}
