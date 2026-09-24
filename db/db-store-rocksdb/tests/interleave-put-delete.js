/**
 * Reproduce the triggers_new stall at the raw RangeObservable level:
 * interleave puts and deletes (writers + processor) with a limit window.
 *
 * The refill in deleteObject only fires when list.length == limit (or a refill is
 * already pending). Once the list is ever below limit — which happens early while
 * fewer than `limit` items exist, or after an underfilled refill — deletes just
 * shrink the list and the window stops sliding. Items beyond the current
 * highest id are never pulled in, so the observable under-reports the store.
 */

import test from 'tape'
import { rimrafSync } from 'rimraf'
import path from 'path'
import { fileURLToPath } from 'url'
import Store from '../lib/Store.js'
import { openTestDown, closeTestDown } from './utils.js'

const here = path.dirname(fileURLToPath(import.meta.url))

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
function idsOf(list) {
  return (list || []).map(o => o && o.id).filter(Boolean)
}
function pad(n) {
  return 'a_' + String(n).padStart(5, '0')
}

async function runScenario(dbPath, { n, limit, writers, processorDelayMs }) {
  rimrafSync(dbPath)
  const down = await openTestDown(dbPath)
  const store = new Store(down, { prefix: 't\x00' })

  const obs = store.rangeObservable({ gte: pad(0), lte: pad(n - 1), limit })
  await obs.readPromise

  let written = 0
  let processed = 0
  let stop = false

  async function writer() {
    while (written < n) {
      const id = pad(written++)
      await store.put({ id, v: id })
    }
  }

  async function processor() {
    while (processed < n && !stop) {
      // process (delete) the lowest-id item currently in the observable
      const list = obs.list || []
      if (list.length === 0) {
        await delay(2)
        continue
      }
      const target = list[0] // lowest id in window
      await store.delete(target.id)
      processed++
      if (processorDelayMs) await delay(processorDelayMs)
    }
  }

  const writersP = Promise.all(Array.from({ length: writers }, writer))
  const procP = processor()
  await Promise.race([
    Promise.all([writersP, procP]),
    delay(30000)
  ])
  stop = true
  await writersP
  await delay(200)

  const realRemaining = idsOf(await store.rangeGet({ gte: pad(0), lte: pad(n - 1) }))
  const realWindow = idsOf(await store.rangeGet({ gte: pad(0), lte: pad(n - 1), limit }))
  const obsIds = idsOf(obs.list)
  await closeTestDown(down, dbPath)
  return { written, processed, realRemaining, realWindow, obsIds }
}

test('RangeObservable interleaved put+delete with limit: observable tracks window (n=200, limit=8)', async t => {
  t.plan(3)
  const r = await runScenario(path.join(here, 'test-interleave-1.db'), {
    n: 200, limit: 8, writers: 4, processorDelayMs: 0
  })
  console.log('written', r.written, 'processed', r.processed)
  console.log('real remaining', r.realRemaining.length)
  console.log('real window', r.realWindow.join(','))
  console.log('observable', r.obsIds.join(','))
  t.equal(r.written, 200, 'all written')
  t.equal(r.realRemaining.length, 0, 'all processed in store')
  t.deepEqual(r.obsIds, r.realWindow, 'observable equals store first limit items')
})

test('RangeObservable interleaved put+delete with limit: observable tracks window (n=400, limit=128)', async t => {
  t.plan(3)
  const r = await runScenario(path.join(here, 'test-interleave-2.db'), {
    n: 400, limit: 128, writers: 8, processorDelayMs: 0
  })
  console.log('written', r.written, 'processed', r.processed)
  console.log('real remaining', r.realRemaining.length)
  console.log('real window', r.realWindow.join(','))
  console.log('observable', r.obsIds.join(','))
  t.equal(r.written, 400, 'all written')
  t.equal(r.realRemaining.length, 0, 'all processed in store')
  t.deepEqual(r.obsIds, r.realWindow, 'observable equals store first limit items')
})
