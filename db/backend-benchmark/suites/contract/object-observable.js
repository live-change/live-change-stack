import { watchObservable } from '../../lib/assert.js'

export const name = 'object-observable'
export const layer = 'store'

export async function run({ store, assert }) {
  const observable = store.objectObservable('A')
  const watch = watchObservable(observable, () => observable.value)
  try {
    const initial = await watch.next()
    assert.equal(initial, null, 'initial null')

    await store.put({ id: 'A', a: 1 })
    const added = await watch.next()
    assert.deepEqual(added, { id: 'A', a: 1 }, 'put notifies')

    await store.delete('A')
    const deleted = await watch.next()
    assert.equal(deleted, null, 'delete notifies')
  } finally {
    watch.stop()
  }
}
