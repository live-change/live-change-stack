import test from 'tape'
import Store from '../lib/Store.js'
import { openTestDown, closeTestDown } from './utils.js'
import PQueue from 'p-queue'

const testQueue = new PQueue({ concurrency: 1 })
function queued(fn) {
  return async t => {
    return await testQueue.add(() => fn(t))
  }
}

const dbPath = `./test.px.db`

test("store prefix isolation and clear", t => {
  t.plan(3)

  let down
  let storeA
  let storeB

  t.test("create stores", queued(async t => {
    t.plan(1)
    down = await openTestDown(dbPath)
    storeA = new Store(down, { prefix: 'a\x00' })
    storeB = new Store(down, { prefix: 'b\x00' })
    t.pass('stores created')
  }))

  t.test("prefix isolation", queued(async t => {
    t.plan(8)
    await storeA.put({ id: 'k', v: 1 })
    await storeB.put({ id: 'k', v: 2 })
    t.deepEqual(await storeA.objectGet('k'), { id: 'k', v: 1 }, 'store A own value')
    t.deepEqual(await storeB.objectGet('k'), { id: 'k', v: 2 }, 'store B own value')
    t.deepEqual(await storeA.rangeGet({}), [{ id: 'k', v: 1 }], 'store A range')
    t.deepEqual(await storeB.rangeGet({}), [{ id: 'k', v: 2 }], 'store B range')
    t.equal(await storeA.countGet({}), 1, 'store A count')
    t.equal(await storeB.countGet({}), 1, 'store B count')
    await storeA.clear()
    t.equal(await storeA.objectGet('k'), null, 'store A cleared')
    t.deepEqual(await storeB.objectGet('k'), { id: 'k', v: 2 }, 'store B intact after A clear')
  }))

  t.test("close and remove database", queued(async t => {
    t.plan(1)
    await closeTestDown(down, dbPath)
    t.pass('removed')
  }))
})
