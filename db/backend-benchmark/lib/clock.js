import fs from 'fs'
import path from 'path'

export function nowNs() {
  return process.hrtime.bigint()
}

export function msSince(t0) {
  return Number(nowNs() - t0) / 1e6
}

export function percentile(sorted, p) {
  if(!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

export async function timedLoop(n, fn) {
  const times = []
  const t0 = nowNs()
  for(let i = 0; i < n; i++) {
    const a = nowNs()
    await fn(i)
    times.push(msSince(a))
  }
  const totalMs = msSince(t0)
  times.sort((a, b) => a - b)
  return {
    n,
    totalMs,
    ops: totalMs > 0 ? (n / (totalMs / 1000)) : n,
    p50: percentile(times, 50),
    p99: percentile(times, 99)
  }
}

export async function mapPool(n, concurrency, fn) {
  let next = 0
  const workers = []
  for(let w = 0; w < concurrency; w++) {
    workers.push((async () => {
      while(true) {
        const i = next++
        if(i >= n) return
        await fn(i)
      }
    })())
  }
  await Promise.all(workers)
}

export function dirSizeBytes(dir) {
  if(!fs.existsSync(dir)) return 0
  let total = 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for(const entry of entries) {
    const full = path.join(dir, entry.name)
    if(entry.isDirectory()) total += dirSizeBytes(full)
    else {
      try {
        total += fs.statSync(full).size
      } catch(e) {}
    }
  }
  return total
}

export function payload(bytes) {
  return 'x'.repeat(bytes)
}
