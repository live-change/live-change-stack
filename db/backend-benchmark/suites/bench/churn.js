import fs from 'fs'
import path from 'path'
import { nowNs, msSince, dirSizeBytes, payload, percentile } from '../../lib/clock.js'
import { padId } from '../../lib/assert.js'

export const name = 'churn'
export const layer = 'store'
export const capabilities = ['rangeDelete']

const STORES = 24
const SMALL_MIN = 1024
const SMALL_MAX = 8192
const LARGE_BYTES = 1024 * 1024
const SMALL_PUTS_PER_STORE = 8
const DELETES_PER_STORE = 4
const TTL_LIMIT = 64
const MID_RANGE_LIMIT = 32
const MID_RANGE_EVERY = 4
const MID_RANGE_STORES = 2
const STAT_EVERY = 10
const PRESSURE_ITERS = 100
const PRESSURE_SMALL = 40
const PRESSURE_DELETES = 10
const RNG_SEED = 0xC0FFEE
const LARGE_KEY = 'LARGE'

function makeRng(seed) {
  let s = seed >>> 0
  return function next() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

function randInt(rng, a, b) {
  return a + Math.floor(rng() * (b - a + 1))
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function latencyStats(times) {
  if(!times.length) {
    return { n: 0, p50: 0, p99: 0, max: 0, avg: 0 }
  }
  const sorted = [...times].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  return {
    n: sorted.length,
    p50: percentile(sorted, 50),
    p99: percentile(sorted, 99),
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length
  }
}

function linearSlope(ys) {
  const n = ys.length
  if(n < 2) return 0
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  for(let i = 0; i < n; i++) {
    const y = ys[i]
    sumX += i
    sumY += y
    sumXY += i * y
    sumXX += i * i
  }
  const denom = n * sumXX - sumX * sumX
  if(!denom) return 0
  return (n * sumXY - sumX * sumY) / denom
}

export async function run(ctx) {
  const { session, size, tmpDir, backendName, assert } = ctx
  const cycles = clamp(Math.round(size / 40), 50, 10000)
  const prefillPerStore = Math.max(2000, Math.round(size / STORES))
  const pinnedCycles = Math.max(20, Math.floor(cycles / 4))
  const maxIds = prefillPerStore + cycles * SMALL_PUTS_PER_STORE + PRESSURE_ITERS * PRESSURE_SMALL + pinnedCycles * SMALL_PUTS_PER_STORE
  const idWidth = Math.max(8, String(maxIds).length)
  const rng = makeRng(RNG_SEED)

  const csvPath = path.join(tmpDir, 'timeseries.csv')
  const lines = ['backend,phase,iteration,op_ms,disk_bytes,extra']
  const envStatSeries = []
  let deleteN = 0
  let cumBytes = 0

  function log(phase, iteration, opMs, disk, extra) {
    lines.push([
      backendName,
      phase,
      iteration,
      opMs.toFixed(3),
      disk || 0,
      extra || 0
    ].join(','))
  }

  function sampleDisk() {
    return dirSizeBytes(tmpDir)
  }

  function snapshotEnvStat() {
    try {
      const st = session.backend && session.backend.envStat && session.backend.envStat(session.db)
      if(!st || !st.available) return { available: false }
      return {
        available: true,
        lastPageNumber: st.lastPageNumber,
        numReaders: st.numReaders,
        fileBytes: st.fileBytes,
        freelistCount: st.freelistCount,
        pageCount: st.pageCount
      }
    } catch(e) {
      return { available: false, error: String(e && e.message || e) }
    }
  }

  function envExtra(st) {
    if(!st || !st.available) return 0
    if(st.lastPageNumber != null) return st.lastPageNumber
    if(st.freelistCount != null) return st.freelistCount
    return 0
  }

  const stores = []
  const states = []
  for(let i = 0; i < STORES; i++) {
    const store = session.createStore('t' + i)
    stores.push(store)
    states.push({
      store,
      liveIds: [],
      nextId: 0
    })
  }

  async function randomDelete(state) {
    if(!state.liveIds.length) return false
    const idx = Math.floor(rng() * state.liveIds.length)
    const id = state.liveIds[idx]
    await state.store.delete(id)
    state.liveIds.splice(idx, 1)
    deleteN++
    return true
  }

  async function ttlPrune(state) {
    if(!state.liveIds.length) return 0
    const n = Math.min(TTL_LIMIT, state.liveIds.length)
    const lastOldest = state.liveIds[n - 1]
    const batch = await state.store.rangeDelete({ lte: lastOldest, limit: n })
    const count = batch && typeof batch.count === 'number' ? batch.count : 0
    if(count > 0) {
      let removed = 0
      while(removed < count && state.liveIds.length && state.liveIds[0] <= lastOldest) {
        state.liveIds.shift()
        removed++
      }
      deleteN += count
    }
    return count
  }

  async function midRangeDelete(state) {
    if(state.liveIds.length < MID_RANGE_LIMIT * 2) return 0
    const mid = Math.floor(state.liveIds.length / 2)
    const gte = state.liveIds[mid]
    const lte = state.liveIds[Math.min(mid + MID_RANGE_LIMIT - 1, state.liveIds.length - 1)]
    const batch = await state.store.rangeDelete({ gte, lte, limit: MID_RANGE_LIMIT })
    const count = batch && typeof batch.count === 'number' ? batch.count : 0
    const last = batch && batch.last != null ? batch.last : lte
    if(count > 0) {
      state.liveIds = state.liveIds.filter(id => id < gte || id > last)
      deleteN += count
    }
    return count
  }

  async function smallPuts(state, count) {
    for(let i = 0; i < count; i++) {
      const sz = randInt(rng, SMALL_MIN, SMALL_MAX)
      const id = padId(state.nextId++, idWidth)
      await state.store.put({ id, p: payload(sz) })
      state.liveIds.push(id)
      cumBytes += sz
    }
  }

  async function largeOverwrite(store) {
    const t0 = nowNs()
    await store.put({ id: LARGE_KEY, p: payload(LARGE_BYTES) })
    return msSince(t0)
  }

  function openPinnedReader() {
    if(backendName === 'lmdb' && session.db && typeof session.db.beginTxn === 'function') {
      const txn = session.db.beginTxn({ readOnly: true })
      return {
        kind: 'lmdb',
        release() {
          try { txn.abort() } catch(e) {}
        }
      }
    }
    if(backendName === 'sqlite') {
      const Database = session.backend && session.backend.Database
      if(!Database) return { skipped: 'sqlite Database ctor missing' }
      const file = path.join(tmpDir, 'data.sqlite')
      if(!fs.existsSync(file)) return { skipped: 'sqlite file missing' }
      const reader = new Database(file, { readonly: true })
      reader.pragma('query_only = ON')
      reader.exec('BEGIN')
      reader.prepare('SELECT 1').get()
      return {
        kind: 'sqlite',
        release() {
          try { reader.exec('ROLLBACK') } catch(e) {}
          try { reader.close() } catch(e) {}
        }
      }
    }
    return { skipped: backendName + ' has no pinned-reader API' }
  }

  async function runChurnCycles(count, phase, logEvery) {
    const latencies = []
    for(let cycle = 0; cycle < count; cycle++) {
      for(let s = 0; s < STORES; s++) {
        await smallPuts(states[s], SMALL_PUTS_PER_STORE)
      }
      for(let s = 0; s < STORES; s++) {
        for(let d = 0; d < DELETES_PER_STORE; d++) {
          await randomDelete(states[s])
        }
      }
      if(cycle % MID_RANGE_EVERY === 0) {
        for(let k = 0; k < MID_RANGE_STORES; k++) {
          await midRangeDelete(states[(cycle + k) % STORES])
        }
      }
      await ttlPrune(states[cycle % STORES])
      const store = stores[cycle % STORES]
      const opMs = await largeOverwrite(store)
      latencies.push(opMs)
      const sample = (cycle % STAT_EVERY === 0) || cycle === count - 1
      let disk = 0
      let extra = 0
      if(sample) {
        disk = sampleDisk()
        const st = snapshotEnvStat()
        extra = envExtra(st)
        envStatSeries.push({ phase, cycle, disk, ...st })
      }
      log(phase, cycle, opMs, disk, extra)
      if(cycle % logEvery === 0 || cycle === count - 1) {
        console.log('[churn] ' + backendName + ' ' + phase + ' ' + cycle + '/' + count +
          ' last=' + opMs.toFixed(1) + 'ms')
      }
    }
    return latencies
  }

  const prefillTotal = prefillPerStore * STORES
  const prefillLogEvery = Math.max(1000, Math.floor(prefillTotal / 50))
  console.log('[churn] ' + backendName + ' prefill stores=' + STORES +
    ' perStore=' + prefillPerStore + ' cycles=' + cycles)
  const prefillStart = nowNs()
  let prefillOps = 0
  for(let i = 0; i < prefillPerStore; i++) {
    for(let s = 0; s < STORES; s++) {
      const sz = randInt(rng, SMALL_MIN, SMALL_MAX)
      const id = padId(states[s].nextId++, idWidth)
      await stores[s].put({ id, p: payload(sz) })
      states[s].liveIds.push(id)
      cumBytes += sz
      prefillOps++
      if(prefillOps % 1000 === 0 || prefillOps === prefillTotal) {
        const disk = (prefillOps % 5000 === 0 || prefillOps === prefillTotal) ? sampleDisk() : 0
        log('prefill', prefillOps, 0, disk, 0)
      }
      if(prefillOps % prefillLogEvery === 0 || prefillOps === prefillTotal) {
        console.log('[churn] ' + backendName + ' prefill ' + prefillOps + '/' + prefillTotal)
      }
    }
  }
  const prefillMs = msSince(prefillStart)
  const diskAfterPrefill = sampleDisk()
  console.log('[churn] ' + backendName + ' prefill done ' + prefillMs.toFixed(0) + 'ms disk=' +
    (diskAfterPrefill / 1024 / 1024).toFixed(0) + 'MiB')

  const churnLogEvery = Math.max(1, Math.floor(cycles / 20))
  const churnLatencies = await runChurnCycles(cycles, 'churn', churnLogEvery)
  const churnStats = latencyStats(churnLatencies)
  const churnSlope = linearSlope(churnLatencies)

  const pressureLatencies = []
  console.log('[churn] ' + backendName + ' pressure ' + PRESSURE_ITERS)
  for(let iter = 0; iter < PRESSURE_ITERS; iter++) {
    const store = stores[iter % STORES]
    const t0 = nowNs()
    await store.put({ id: 'P' + padId(iter, 8), p: payload(LARGE_BYTES) })
    const opMs = msSince(t0)
    pressureLatencies.push(opMs)
    for(let i = 0; i < PRESSURE_SMALL; i++) {
      await smallPuts(states[(iter + i) % STORES], 1)
    }
    for(let i = 0; i < PRESSURE_DELETES; i++) {
      await randomDelete(states[(iter + i) % STORES])
    }
    const sample = (iter % 5 === 0) || iter === PRESSURE_ITERS - 1
    const disk = sample ? sampleDisk() : 0
    const extra = sample ? envExtra(snapshotEnvStat()) : 0
    log('pressure', iter, opMs, disk, extra)
    if(iter % 10 === 0 || iter === PRESSURE_ITERS - 1) {
      console.log('[churn] ' + backendName + ' pressure ' + iter + '/' + PRESSURE_ITERS +
        ' ' + opMs.toFixed(1) + 'ms')
    }
  }
  const pressureStats = latencyStats(pressureLatencies)
  const pressureSlope = linearSlope(pressureLatencies)

  let pinned = null
  let pinnedReader = null
  try {
    pinnedReader = openPinnedReader()
  } catch(e) {
    pinnedReader = { skipped: String(e && e.message || e) }
  }
  if(pinnedReader && pinnedReader.skipped) {
    pinned = { skipped: pinnedReader.skipped }
    console.log('[churn] ' + backendName + ' pinned skip: ' + pinnedReader.skipped)
  } else {
    try {
      console.log('[churn] ' + backendName + ' pinned ' + pinnedCycles + ' kind=' + pinnedReader.kind)
      const pinnedLatencies = await runChurnCycles(pinnedCycles, 'pinned', Math.max(1, Math.floor(pinnedCycles / 10)))
      pinned = {
        kind: pinnedReader.kind,
        largeOverwrite: latencyStats(pinnedLatencies),
        slopeMsPerCycle: linearSlope(pinnedLatencies)
      }
    } catch(e) {
      pinned = { skipped: String(e && e.message || e) }
    } finally {
      if(pinnedReader && typeof pinnedReader.release === 'function') {
        pinnedReader.release()
      }
    }
  }

  const timeseriesCsv = lines.join('\n') + '\n'
  fs.writeFileSync(csvPath, timeseriesCsv)

  const diskFinal = dirSizeBytes(tmpDir)
  const rssFinal = process.memoryUsage().rss

  assert.ok(churnLatencies.length === cycles, 'completed churn cycles')
  assert.ok(churnStats.n === cycles, 'completed large overwrites')
  assert.ok(deleteN > 0, 'deleted keys during churn')
  assert.ok(Number.isFinite(churnStats.max), 'churn max latency is finite')
  assert.ok(pressureStats.n === PRESSURE_ITERS, 'completed pressure puts')

  ctx.metrics = {
    parameters: {
      stores: STORES,
      cycles,
      prefillPerStore,
      prefillTotal,
      pinnedCycles,
      smallMin: SMALL_MIN,
      smallMax: SMALL_MAX,
      largeBytes: LARGE_BYTES,
      smallPutsPerStore: SMALL_PUTS_PER_STORE,
      deletesPerStore: DELETES_PER_STORE,
      ttlLimit: TTL_LIMIT,
      pressureIters: PRESSURE_ITERS,
      fillBytes: cumBytes
    },
    prefill: {
      totalMs: prefillMs,
      ops: prefillMs > 0 ? prefillTotal / (prefillMs / 1000) : prefillTotal,
      diskAfter: diskAfterPrefill
    },
    churn: {
      largeOverwrite: churnStats,
      slopeMsPerCycle: churnSlope,
      deleteCount: deleteN
    },
    pressure: {
      ...pressureStats,
      slopeMsPerIter: pressureSlope
    },
    pinned,
    envStat: envStatSeries,
    diskFinal,
    rssFinal,
    timeseriesCsv
  }
}
