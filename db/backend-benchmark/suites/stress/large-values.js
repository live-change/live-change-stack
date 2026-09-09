import { padId } from '../../lib/assert.js'
import { payload } from '../../lib/clock.js'

export const name = 'large-values'
export const layer = 'store'

export async function run({ store, assert, size }) {
  const count = size >= 100000 ? 1000 : 200
  const bytes = size >= 100000 ? 256 * 1024 : 64 * 1024
  const blob = payload(bytes)
  for(let i = 0; i < count; i++) {
    await store.put({ id: padId(i), p: blob })
  }
  const got = await store.objectGet(padId(0))
  assert.equal(got.p.length, bytes, 'large value roundtrip')
  const rss = process.memoryUsage().rss
  assert.ok(rss > 0, 'rss ' + rss)
}
