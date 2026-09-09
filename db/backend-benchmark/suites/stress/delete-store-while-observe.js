import { watchObservable } from '../../lib/assert.js'

export const name = 'delete-store-while-observe'
export const layer = 'store'

export async function run({ session, store, assert }) {
  await store.put({ id: 'a', v: 1 })
  const observable = store.rangeObservable({ gte: 'a', lte: 'z', limit: 16 })
  const watch = watchObservable(observable, () => (observable.list || []).slice())
  try {
    await watch.next()
    await session.deleteStore('data')
    assert.ok(true, 'deleteStore while observing did not crash')
  } finally {
    try { watch.stop() } catch(e) {}
  }
}
