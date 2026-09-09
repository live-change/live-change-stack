import { padId } from '../../lib/assert.js'

export const name = 'many-observers'
export const layer = 'store'

export async function run({ store, assert }) {
  for(let i = 0; i < 50; i++) {
    await store.put({ id: padId(i), v: i })
  }
  const observers = []
  for(let i = 0; i < 200; i++) {
    const range = store.rangeObservable({
      gte: padId(0),
      lte: padId(49),
      limit: 16
    })
    range.observe(() => {})
    observers.push(range)
  }
  for(let i = 0; i < 80; i++) {
    await store.put({ id: padId(i % 50), v: i })
    if(i % 4 === 0) await store.delete(padId((i + 3) % 50))
  }
  const got = await store.rangeGet({ gte: padId(0), lte: padId(49), limit: 16 })
  assert.ok(Array.isArray(got), 'range still works with 200 observers')
}
