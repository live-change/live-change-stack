import { watchObservable } from '../../lib/assert.js'

export const name = 'overlapping-observers'
export const layer = 'store'

export async function run({ store, assert }) {
  for(let i = 0; i < 20; i++) {
    await store.put({ id: String.fromCharCode(97 + (i % 26)) + i, v: i })
  }

  const r1 = store.rangeObservable({ gte: 'a', lt: 'm', limit: 64 })
  const r2 = store.rangeObservable({ gte: 'g', lt: 't', limit: 64 })
  const r3 = store.rangeObservable({ gte: 'a', lte: 'z', limit: 64 })
  const w1 = watchObservable(r1, () => r1.list.slice())
  const w2 = watchObservable(r2, () => r2.list.slice())
  const w3 = watchObservable(r3, () => r3.list.slice())
  try {
    await w1.next()
    await w2.next()
    await w3.next()

    for(let i = 0; i < 80; i++) {
      const id = 'k' + i
      await store.put({ id, v: i })
      if(i % 3 === 0) await store.delete('k' + Math.max(0, i - 10))
    }

    async function drain(watch) {
      while(watch.pending() > 0) await watch.next()
    }
    await drain(w1)
    await drain(w2)
    await drain(w3)

    const g1 = await store.rangeGet({ gte: 'a', lt: 'm', limit: 64 })
    const g2 = await store.rangeGet({ gte: 'g', lt: 't', limit: 64 })
    const g3 = await store.rangeGet({ gte: 'a', lte: 'z', limit: 64 })
    assert.deepEqual(r1.list, g1, 'observer 1 matches rangeGet')
    assert.deepEqual(r2.list, g2, 'observer 2 matches rangeGet')
    assert.deepEqual(r3.list, g3, 'observer 3 matches rangeGet')
  } finally {
    w1.stop()
    w2.stop()
    w3.stop()
  }
}
