import Store from '../lib/Store.js'
import { runRangeObservableStressSuite } from '../../db/test-helpers/rangeObservableStress.js'

runRangeObservableStressSuite({
  label: 'rbtree',
  async makeStore() {
    return { store: new Store() }
  },
  async cleanup() {}
})
