import { timedLoop, mapPool, payload, dirSizeBytes, nowNs, msSince } from '../../lib/clock.js'
import { padId } from '../../lib/assert.js'

export const name = 'run'
export const layer = 'store'

function rss() {
  return process.memoryUsage().rss
}

export async function run(ctx) {
  const { store, size, tmpDir } = ctx
  const n = Math.max(100, size)
  const metrics = {}

  async function warmup(count = Math.min(200, n)) {
    for(let i = 0; i < count; i++) {
      await store.put({ id: 'w' + padId(i), v: i })
    }
  }
  await warmup()

  metrics.sequentialPut = await timedLoop(n, async i => {
    await store.put({ id: 's' + padId(i), v: i, p: payload(100) })
  })
  metrics.sequentialPut.rss = rss()
  metrics.sequentialPut.disk = dirSizeBytes(tmpDir)

  const tPar = nowNs()
  await mapPool(n, 32, async i => {
    await store.put({ id: 'p' + padId(i), v: i })
  })
  const parMs = msSince(tPar)
  metrics.parallelPut = {
    n,
    totalMs: parMs,
    ops: parMs > 0 ? n / (parMs / 1000) : n,
    rss: rss()
  }

  metrics.randomGet = await timedLoop(Math.min(n, 2000), async i => {
    await store.objectGet('s' + padId(i % n))
  })

  metrics.rangePrefix = await timedLoop(Math.min(200, n), async () => {
    await store.rangeGet({ gte: 's', lt: 't', limit: 32 })
  })

  metrics.rangeReverse = await timedLoop(Math.min(200, n), async () => {
    await store.rangeGet({ gte: 's', lt: 't', reverse: true, limit: 32 })
  })

  metrics.hotUpdate = await timedLoop(Math.min(n, 2000), async i => {
    await store.put({ id: 'hot', v: i })
  })

  metrics.mixed = await timedLoop(Math.min(n, 2000), async i => {
    if(i % 5 === 0) await store.put({ id: 'm' + padId(i), v: i })
    else await store.objectGet('s' + padId(i % n))
  })

  const live0 = await timedLoop(Math.min(500, n), async i => {
    await store.put({ id: 'o0' + padId(i), v: i })
  })
  metrics.putObservers0 = live0

  const obs1 = store.rangeObservable({ gte: 'o1', lt: 'o2', limit: 32 })
  obs1.observe(() => {})
  metrics.putObservers1 = await timedLoop(Math.min(500, n), async i => {
    await store.put({ id: 'o1' + padId(i), v: i })
  })

  const observers = []
  for(let i = 0; i < 10; i++) {
    const o = store.rangeObservable({ gte: 'o2', lt: 'o3', limit: 32 })
    o.observe(() => {})
    observers.push(o)
  }
  metrics.putObservers10 = await timedLoop(Math.min(500, n), async i => {
    await store.put({ id: 'o2' + padId(i), v: i })
  })

  const n4k = Math.min(200, Math.floor(n / 10))
  metrics.put4KiB = await timedLoop(n4k, async i => {
    await store.put({ id: 'k4' + padId(i), v: i, p: payload(4096) })
  })

  const n64k = Math.min(50, Math.floor(n / 50))
  metrics.put64KiB = await timedLoop(n64k, async i => {
    await store.put({ id: 'k64' + padId(i), v: i, p: payload(65536) })
  })
  metrics.put64KiB.rss = rss()
  metrics.put64KiB.disk = dirSizeBytes(tmpDir)

  ctx.metrics = metrics
}
