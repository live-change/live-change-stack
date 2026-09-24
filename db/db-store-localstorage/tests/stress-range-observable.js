// browser-only: this package is CJS in Node; the shared suite is ESM.
// CI Node skips the real stress (fake-indexeddb + BroadcastChannel). RangeObservable
// still has the same refill queue fix as the other stores.
const test = require('tape')

test('localstorage range observable stress (browser-only)', t => {
  t.skip('browser-only store')
  t.end()
})
