/**
 * Shared RangeObservable stress suite for db-store-* backends.
 * Catch refill overfill / stalled limited windows after interleaved put+delete.
 */

import test from 'tape'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function idsOf(list) {
  return (list || []).map(o => o && o.id).filter(Boolean)
}

function pad(n) {
  return 'a_' + String(n).padStart(5, '0')
}

function sortedCopy(ids, reverse) {
  const copy = ids.slice().sort()
  return reverse ? copy.reverse() : copy
}

function checkInvariant(obs, limit, reverse, violations, where) {
  const ids = idsOf(obs.list)
  if (limit && ids.length > limit) violations.push(`${where}: overfill ${ids.length}>${limit}`)
  if (new Set(ids).size !== ids.length) violations.push(`${where}: dups`)
  const sorted = sortedCopy(ids, reverse)
  if (ids.join() !== sorted.join()) violations.push(`${where}: unsorted`)
}

async function settle(ms = 50) {
  await delay(ms)
}

/**
 * @param {{
 *   makeStore: (dbPath: string) => Promise<{ store: any }>,
 *   cleanup: (ctx: any) => Promise<void>,
 *   label: string
 * }} opts
 */
export function runRangeObservableStressSuite({ makeStore, cleanup, label }) {
  const prefix = label || 'store'

  test(`${prefix}: interleaved put+delete with limit (n=400, limit=128)`, async t => {
    t.plan(5)
    const ctx = await makeStore(`test-stress-interleave-${label}.db`)
    const { store } = ctx
    try {
      const n = 400
      const limit = 128
      const range = { gte: pad(0), lte: pad(n - 1), limit }
      const obs = store.rangeObservable(range)
      if (obs.readPromise) await obs.readPromise

      let written = 0
      let writersDone = false
      let stalled = null
      const violations = []

      async function writer() {
        while (true) {
          const i = written++
          if (i >= n) {
            written--
            return
          }
          await store.put({ id: pad(i), v: i })
          checkInvariant(obs, limit, false, violations, 'put')
        }
      }

      async function processor() {
        const started = Date.now()
        while (Date.now() - started < 30000) {
          const list = obs.list || []
          if (list.length === 0) {
            if (writersDone) {
              const remaining = await store.rangeGet({ gte: pad(0), lte: pad(n - 1) })
              if (remaining.length === 0) return
              stalled = idsOf(remaining)
              return
            }
            await delay(2)
            continue
          }
          await store.delete(list[0].id)
          checkInvariant(obs, limit, false, violations, 'delete')
        }
      }

      const writersP = Promise.all(Array.from({ length: 8 }, writer))
      const procP = processor()
      await writersP
      writersDone = true
      await procP
      await settle(80)

      const realRemaining = idsOf(await store.rangeGet({ gte: pad(0), lte: pad(n - 1) }))
      const realWindow = idsOf(await store.rangeGet(range))
      const obsIds = idsOf(obs.list)
      t.equal(violations.length, 0, violations[0] || 'no invariant violations')
      t.equal(stalled, null, stalled ? `stalled remaining ${stalled.join(',')}` : 'processor did not stall')
      t.equal(realRemaining.length, 0, 'store empty after processing')
      t.deepEqual(obsIds, realWindow, 'observable matches store window')
      t.ok(obsIds.length <= limit, 'final list within limit')
    } finally {
      await cleanup(ctx)
    }
  })

  test(`${prefix}: refill race concurrent in-window + beyond-window delete`, async t => {
    t.plan(3)
    const ctx = await makeStore(`test-stress-race-${label}.db`)
    const { store } = ctx
    try {
      const n = 40
      const limit = 5
      for (let i = 0; i < n; i++) await store.put({ id: pad(i), v: i })
      const range = { gte: pad(0), lte: pad(n - 1), limit }
      const obs = store.rangeObservable(range)
      if (obs.readPromise) await obs.readPromise

      for (let i = 0; i < 20; i++) {
        const inWindow = pad(i % 8)
        const beyond = pad((i % 8) + 8)
        await Promise.all([
          store.delete(inWindow).catch(() => {}),
          store.delete(beyond).catch(() => {})
        ])
      }
      await settle(80)

      const realWindow = idsOf(await store.rangeGet(range))
      const obsIds = idsOf(obs.list)
      t.ok(obsIds.length <= limit, 'within limit after race')
      t.equal(new Set(obsIds).size, obsIds.length, 'no dups after race')
      t.deepEqual(obsIds, realWindow, 'observable matches store after race')
    } finally {
      await cleanup(ctx)
    }
  })

  test(`${prefix}: refill underfill then slide (Fix B)`, async t => {
    t.plan(4)
    const ctx = await makeStore(`test-stress-underfill-${label}.db`)
    const { store } = ctx
    try {
      const n = 20
      const limit = 5
      for (let i = 0; i < n; i++) await store.put({ id: pad(i), v: i })
      const range = { gte: pad(0), lte: pad(n + 20 - 1), limit }
      const obs = store.rangeObservable(range)
      if (obs.readPromise) await obs.readPromise

      await Promise.all([
        store.delete(pad(0)),
        store.delete(pad(1)),
        store.delete(pad(2)),
        store.delete(pad(3)),
        store.delete(pad(4)),
        store.delete(pad(5)),
        store.delete(pad(6)),
        store.delete(pad(7))
      ])
      await settle(80)

      let realWindow = idsOf(await store.rangeGet({ gte: pad(0), lte: pad(n + 20 - 1), limit }))
      t.deepEqual(idsOf(obs.list), realWindow, 'window refills after burst deletes')
      t.ok(obs.list.length <= limit, 'still within limit')

      for (let i = n; i < n + 10; i++) await store.put({ id: pad(i), v: i })
      await settle(50)

      const windowNow = idsOf(obs.list).slice()
      await Promise.all(windowNow.map(id => store.delete(id)))
      await settle(80)

      realWindow = idsOf(await store.rangeGet({ gte: pad(0), lte: pad(n + 20 - 1), limit }))
      t.deepEqual(idsOf(obs.list), realWindow, 'window slides after underfill + new puts')
      t.equal(idsOf(obs.list).length, Math.min(limit, realWindow.length), 'window filled to remaining or limit')
    } finally {
      await cleanup(ctx)
    }
  })

  test(`${prefix}: reverse range with limit + interleaved`, async t => {
    t.plan(3)
    const ctx = await makeStore(`test-stress-reverse-${label}.db`)
    const { store } = ctx
    try {
      const n = 80
      const limit = 8
      const range = { gte: pad(0), lte: pad(n - 1), limit, reverse: true }
      const obs = store.rangeObservable(range)
      if (obs.readPromise) await obs.readPromise

      let written = 0
      let writersDone = false
      let stalled = null

      async function writer() {
        while (true) {
          const i = written++
          if (i >= n) {
            written--
            return
          }
          await store.put({ id: pad(i), v: i })
        }
      }

      async function processor() {
        const started = Date.now()
        while (Date.now() - started < 20000) {
          const list = obs.list || []
          if (list.length === 0) {
            if (writersDone) {
              const remaining = await store.rangeGet({ gte: pad(0), lte: pad(n - 1) })
              if (remaining.length === 0) return
              stalled = idsOf(remaining)
              return
            }
            await delay(2)
            continue
          }
          await store.delete(list[0].id)
        }
      }

      const writersP = Promise.all(Array.from({ length: 4 }, writer))
      const procP = processor()
      await writersP
      writersDone = true
      await procP
      await settle(80)

      const realRemaining = idsOf(await store.rangeGet({ gte: pad(0), lte: pad(n - 1) }))
      const realWindow = idsOf(await store.rangeGet(range))
      t.equal(stalled, null, stalled ? `reverse stalled ${stalled.join(',')}` : 'no reverse stall')
      t.equal(realRemaining.length, 0, 'reverse: store empty')
      t.deepEqual(idsOf(obs.list), realWindow, 'reverse observable matches store window')
    } finally {
      await cleanup(ctx)
    }
  })

  test(`${prefix}: batched concurrent deletes match store window`, async t => {
    t.plan(3)
    const ctx = await makeStore(`test-stress-batch-${label}.db`)
    const { store } = ctx
    try {
      const n = 60
      const limit = 8
      for (let i = 0; i < n; i++) await store.put({ id: pad(i), v: i })
      const range = { gte: pad(0), lte: pad(n - 1), limit }
      const obs = store.rangeObservable(range)
      if (obs.readPromise) await obs.readPromise

      const toDelete = []
      for (let i = 0; i < n - 7; i++) toDelete.push(pad(i))
      const batch = 12
      for (let i = 0; i < toDelete.length; i += batch) {
        await Promise.all(toDelete.slice(i, i + batch).map(id => store.delete(id)))
      }
      await settle(80)

      const realRemaining = idsOf(await store.rangeGet({ gte: pad(0), lte: pad(n - 1) }))
      const realWindow = idsOf(await store.rangeGet(range))
      t.equal(realRemaining.length, 7, 'seven remain in store')
      t.ok(idsOf(obs.list).length <= limit, 'within limit')
      t.deepEqual(idsOf(obs.list), realWindow, 'observable equals store first limit')
    } finally {
      await cleanup(ctx)
    }
  })
}
