import Store from '../lib/Store.js'
import { openTestDown, closeTestDown } from './utils.js'
import { runRangeObservableStressSuite } from '../../db/test-helpers/rangeObservableStress.js'

runRangeObservableStressSuite({
  label: 'level',
  async makeStore(dbPath) {
    const down = await openTestDown(dbPath)
    const store = new Store(down, { prefix: 't\x00' })
    return { store, down, dbPath }
  },
  async cleanup(ctx) {
    await closeTestDown(ctx.down, ctx.dbPath)
  }
})
