export const COLORS = {
  lmdb: '#2563eb',
  memory: '#64748b',
  leveldb: '#16a34a',
  rocksdb: '#dc2626',
  sqlite: '#d97706',
  memdown: '#7c3aed'
}

export function colorFor(name) {
  return COLORS[name] || '#334155'
}

export function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const NUMERIC_FIELDS = new Set([
  'iteration',
  'op_ms',
  'cumulative_bytes',
  'disk_bytes',
  'rss_bytes',
  'extra'
])

export function parseCsv(text) {
  if(!text) return []
  const lines = String(text).trim().split(/\n/)
  if(lines.length < 2) return []
  const header = lines[0].split(',')
  const rows = []
  for(let i = 1; i < lines.length; i++) {
    if(!lines[i]) continue
    const cols = lines[i].split(',')
    const row = {}
    for(let j = 0; j < header.length; j++) {
      const key = header[j]
      const value = cols[j]
      row[key] = NUMERIC_FIELDS.has(key) ? Number(value) : value
    }
    rows.push(row)
  }
  return rows
}

export function downsample(points, maxN) {
  if(points.length <= maxN) return points
  const out = []
  const step = (points.length - 1) / (maxN - 1)
  for(let i = 0; i < maxN; i++) {
    out.push(points[Math.round(i * step)])
  }
  return out
}

export function logTicks(minV, maxV) {
  const ticks = [0.01, 0.1, 1, 10, 100, 1000, 10000, 60000, 120000, 300000, 600000]
  const lo = Math.max(minV, 0.01)
  const hi = Math.max(maxV, lo * 10)
  return ticks.filter(t => t >= lo / 3 && t <= hi * 3)
}

export function yLog(v, minV, maxV, y0, height) {
  const lo = Math.log10(Math.max(minV, 0.01))
  const hi = Math.log10(Math.max(maxV, minV * 10, 0.1))
  const t = (Math.log10(Math.max(v, 0.01)) - lo) / (hi - lo || 1)
  return y0 + height - t * height
}

export function yLin(v, minV, maxV, y0, height) {
  const t = (v - minV) / ((maxV - minV) || 1)
  return y0 + height - t * height
}

export function xPos(i, n, x0, width) {
  if(n <= 1) return x0
  return x0 + (i / (n - 1)) * width
}

export function polyline(points, x0, y0, width, height, yFn) {
  if(!points.length) return ''
  const n = points.length
  const d = points.map((p, i) => {
    const x = xPos(i, n, x0, width)
    const y = yFn(p.y, y0, height)
    return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ')
  return d
}

export function niceLinearTicks(minV, maxV) {
  const span = maxV - minV || 1
  const step = Math.pow(10, Math.floor(Math.log10(span))) / 2
  const ticks = []
  const start = Math.floor(minV / step) * step
  for(let t = start; t <= maxV + step / 2; t += step) ticks.push(t)
  return ticks.slice(0, 8)
}

export function panelChart({
  title,
  series,
  x0,
  y0,
  width,
  height,
  logScale,
  yMin,
  yMax,
  yTickFormat
}) {
  const parts = []
  parts.push(`<rect x="${x0}" y="${y0}" width="${width}" height="${height}" fill="#f8fafc" stroke="#cbd5e1"/>`)
  parts.push(`<text x="${x0}" y="${y0 - 8}" font-size="13" font-family="sans-serif" fill="#0f172a">${escapeXml(title)}</text>`)
  const ticks = logScale ? logTicks(yMin, yMax) : niceLinearTicks(yMin, yMax)
  const yFn = (v, top, h) => logScale ? yLog(v, yMin, yMax, top, h) : yLin(v, yMin, yMax, top, h)
  for(const tick of ticks) {
    const y = yFn(tick, y0, height)
    if(y < y0 - 1 || y > y0 + height + 1) continue
    parts.push(`<line x1="${x0}" y1="${y.toFixed(1)}" x2="${x0 + width}" y2="${y.toFixed(1)}" stroke="#e2e8f0"/>`)
    parts.push(`<text x="${x0 - 6}" y="${(y + 4).toFixed(1)}" font-size="10" font-family="sans-serif" fill="#64748b" text-anchor="end">${escapeXml(yTickFormat(tick))}</text>`)
  }
  for(const s of series) {
    if(!s.points.length) continue
    const d = polyline(s.points, x0, y0, width, height, (v, top, h) => yFn(v, top, h))
    parts.push(`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="1.6"/>`)
  }
  return parts.join('\n')
}

export function fmtMsTick(v) {
  const n = Number(v)
  if(!Number.isFinite(n)) return ''
  if(n >= 60000) return (n / 60000).toFixed(1) + ' min'
  if(n >= 1000) return (n / 1000).toFixed(2) + ' s'
  return n.toFixed(2) + ' ms'
}

export function fmtMiBTick(v) {
  return (v / 1024 / 1024).toFixed(0) + ' MiB'
}

export function legend(names, x, y) {
  return names.map((name, i) => {
    const lx = x + i * 110
    return [
      `<rect x="${lx}" y="${y - 8}" width="12" height="12" fill="${colorFor(name)}"/>`,
      `<text x="${lx + 16}" y="${y + 2}" font-size="12" font-family="sans-serif" fill="#0f172a">${escapeXml(name)}</text>`
    ].join('\n')
  }).join('\n')
}

export function wrapSvg(width, height, inner) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    inner,
    `</svg>`
  ].join('\n')
}
