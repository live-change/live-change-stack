import { watchObservable } from '../../lib/assert.js'

export const name = 'count-observable'
export const layer = 'store'
export const capabilities = ['countObservable']

export async function run({ store, assert }) {
  await store.put({ v: 1, id: 'a' })
  await store.put({ v: 3, id: 'c' })

  const observable = store.countObservable({ gte: 'a', lte: 'z' })
  const watch = watchObservable(observable, () => observable.value)
  try {
    assert.equal(await watch.next(), 2, 'initial count')

    await store.delete('a')
    assert.equal(await watch.next(), 1, 'delete decrements')

    await store.put({ id: 'a', v: 4 })
    assert.equal(await watch.next(), 2, 'put increments')

    await store.put({ id: 'b', v: 5 })
    assert.equal(await watch.next(), 3, 'put b increments')
  } finally {
    watch.stop()
  }
}
