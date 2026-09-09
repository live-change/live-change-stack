import { padId } from '../../lib/assert.js'

export const name = 'unbounded-range'
export const layer = 'store'

export async function run({ store, assert, backendName }) {
  const n = 5000
  for(let i = 0; i < n; i++) {
    await store.put({ id: padId(i), v: i })
  }
  let outcome = 'returns'
  try {
    await store.rangeGet({})
  } catch(e) {
    outcome = 'throws'
  }
  if(backendName === 'lmdb') {
    assert.equal(outcome, 'throws', 'lmdb unbounded range without limit must throw')
  } else {
    assert.ok(outcome === 'throws' || outcome === 'returns', 'must not crash')
  }
}
