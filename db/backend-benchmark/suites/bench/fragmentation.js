import fs from 'fs'
import path from 'path'
import { nowNs, msSince, dirSizeBytes, payload, percentile } from '../../lib/clock.js'
import { padId } from '../../lib/assert.js'

export const name = 'fragmentation'
export const layer = 'store'
export const capabilities = ['durable', 'rangeDelete']

const SMALL_MIN = 1024
const SMALL_MAX = 40960
const LARGE_BYTES = 1024 * 1024
const LARGE_PUTS = 50
const STEADY_ITERATIONS = 20
const RNG_SEED = 0xC0FFEE

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

export async function run(ctx) {
  const { store, size, tmpDir, backendName, assert } = ctx
  const n = Math.max(1000, size)
  const deleteCount = Math.floor(n * 0.1)
  const idWidth = Math.max(6, String(n).length)
  const fillLogEvery = n > 20000 ? Math.max(1, Math.floor(n / 2000)) : 1
  const fillProgressEvery = Math.max(1000, Math.floor(n / 50))
  const rng = makeRng(RNG_SEED)

  const csvPath = path.join(tmpDir, 'timeseries.csv')
  const lines = ['backend,phase,iteration,op_ms,cumulative_bytes,disk_bytes,rss_bytes']

  function log(phase, iteration, opMs, cumBytes, disk, rss) {
    lines.push([
      backendName,
      phase,
      iteration,
      opMs.toFixed(3),
      cumBytes,
      disk,
      rss
    ].join(','))
  }

  function sampleDiskRss() {
    return {
      disk: dirSizeBytes(tmpDir),
      rss: process.memoryUsage().rss
    }
  }

  let cumBytes = 0
  const fillStart = nowNs()
  for(let i = 0; i < n; i++) {
    const sz = randInt(rng, SMALL_MIN, SMALL_MAX)
    const t0 = nowNs()
    await store.put({ id: padId(i, idWidth), p: payload(sz) })
    const opMs = msSince(t0)
    cumBytes += sz
    const keepRow = (i % fillLogEvery === 0) || i === n - 1
    if(keepRow) {
      const sample = (i % 1000 === 0 || i === n - 1)
      if(sample) {
        const { disk, rss } = sampleDiskRss()
        log('fill', i, opMs, cumBytes, disk, rss)
      } else {
        log('fill', i, opMs, cumBytes, 0, 0)
      }
    }
    if(i % fillProgressEvery === 0) {
      console.log('[fragment] ' + backendName + ' fill ' + i + '/' + n +
        ' last=' + opMs.toFixed(2) + 'ms cum=' + (cumBytes / 1024 / 1024).toFixed(0) + 'MiB')
    }
  }
  const fillMs = msSince(fillStart)
  const diskAfterFill = dirSizeBytes(tmpDir)
  console.log('[fragment] ' + backendName + ' fill done n=' + n +
    ' totalMs=' + fillMs.toFixed(0) + ' disk=' + (diskAfterFill / 1024 / 1024).toFixed(0) + 'MiB')

  const delStart = nowNs()
  console.log('[fragment] ' + backendName + ' prune oldest ' + deleteCount)
  let deleteN = 0
  let pruneLast
  const pruneEnd = padId(deleteCount, idWidth)
  while(true) {
    const req = { lt: pruneEnd, limit: 1024 }
    if(pruneLast != null) req.gt = pruneLast
    const batch = await store.rangeDelete(req)
    const batchCount = batch && typeof batch.count === 'number' ? batch.count : 0
    if(!batchCount) break
    deleteN += batchCount
    pruneLast = batch.last
    if(deleteN % 10240 === 0) {
      console.log('[fragment] ' + backendName + ' prune ' + deleteN + '/' + deleteCount)
    }
  }
  const deleteMs = msSince(delStart)
  const { disk: diskAfterDelete, rss: rssAfterDelete } = sampleDiskRss()
  log('delete', 0, deleteMs, cumBytes, diskAfterDelete, rssAfterDelete)
  console.log('[fragment] ' + backendName + ' prune done count=' + deleteN +
    ' ' + deleteMs.toFixed(0) + 'ms')

  const largeLatencies = []
  for(let i = 0; i < LARGE_PUTS; i++) {
    const t0 = nowNs()
    await store.put({ id: 'L' + padId(i, 8), p: payload(LARGE_BYTES) })
    const opMs = msSince(t0)
    largeLatencies.push(opMs)
    if(i === 0 || i === LARGE_PUTS - 1 || i % 10 === 0) {
      console.log('[fragment] ' + backendName + ' large-put ' + i + '/' + LARGE_PUTS +
        ' ' + opMs.toFixed(1) + 'ms')
    }
    if(i % 5 === 0 || i === LARGE_PUTS - 1) {
      const { disk, rss } = sampleDiskRss()
      log('large-put', i, opMs, 0, disk, rss)
    } else {
      log('large-put', i, opMs, 0, 0, 0)
    }
  }
  const diskAfterLarge = dirSizeBytes(tmpDir)

  const steadyLatencies = []
  for(let i = 0; i < STEADY_ITERATIONS; i++) {
    const tPut = nowNs()
    await store.put({ id: 'S' + padId(i, 8), p: payload(LARGE_BYTES) })
    const putMs = msSince(tPut)
    steadyLatencies.push(putMs)
    const tDel = nowNs()
    await store.delete('L' + padId(i, 8))
    const delMs = msSince(tDel)
    if(i % 2 === 0 || i === STEADY_ITERATIONS - 1) {
      const { disk, rss } = sampleDiskRss()
      log('steady', i, putMs, 0, disk, rss)
    } else {
      log('steady', i, putMs, 0, 0, 0)
    }
    log('steady-delete', i, delMs, 0, 0, 0)
  }

  const timeseriesCsv = lines.join('\n') + '\n'
  fs.writeFileSync(csvPath, timeseriesCsv)

  const largePut = latencyStats(largeLatencies)
  const steady = latencyStats(steadyLatencies)
  const diskFinal = dirSizeBytes(tmpDir)
  const rssFinal = process.memoryUsage().rss

  assert.ok(deleteN > 0, 'deleted oldest 10% of fill rows')
  assert.ok(largePut.n === LARGE_PUTS, 'completed large puts')
  assert.ok(Number.isFinite(largePut.max), 'large-put max latency is finite')

  ctx.metrics = {
    parameters: {
      n,
      deleteCount,
      fillBytes: cumBytes,
      largePuts: LARGE_PUTS,
      steadyIterations: STEADY_ITERATIONS,
      smallMin: SMALL_MIN,
      smallMax: SMALL_MAX,
      largeBytes: LARGE_BYTES
    },
    fill: {
      totalMs: fillMs,
      ops: fillMs > 0 ? n / (fillMs / 1000) : n,
      diskAfter: diskAfterFill
    },
    delete: {
      totalMs: deleteMs,
      count: deleteN,
      diskAfter: diskAfterDelete
    },
    largePut: {
      ...largePut,
      diskAfter: diskAfterLarge
    },
    steady,
    diskFinal,
    rssFinal,
    timeseriesCsv
  }
}
