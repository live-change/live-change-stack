import fs from 'fs'
import path from 'path'

function pad(s, n) {
  s = String(s)
  if(s.length >= n) return s
  return s + ' '.repeat(n - s.length)
}

function cell(value) {
  if(!value) return ''
  if(value.status === 'pass') return 'pass'
  if(value.status === 'skip') return 'skip'
  if(value.status === 'unavailable') return 'unavailable'
  if(value.status === 'fail') {
    const msg = (value.error || '').split('\n')[0]
    return 'FAIL ' + msg.slice(0, 60)
  }
  return value.status
}

export function buildRows(backendResults, suiteIds) {
  return backendResults.map(backend => {
    const row = {
      backend: backend.name,
      available: backend.available ? 'yes' : 'no',
      reason: backend.reason || ''
    }
    for(const id of suiteIds) {
      row[id] = cell(backend.results[id])
    }
    return row
  })
}

export function formatTable(backendResults, suiteNames) {
  const headers = ['backend', 'available', ...suiteNames]
  const rows = backendResults.map(backend => {
    const cells = [backend.name, backend.available ? 'yes' : ('no' + (backend.reason ? ' (' + backend.reason.split('\n')[0].slice(0, 40) + ')' : ''))]
    for(const suite of suiteNames) {
      const items = Object.entries(backend.results).filter(([id]) => id.startsWith(suite + '/'))
      if(!backend.available) {
        cells.push(backend.reason ? 'unavailable' : '')
        continue
      }
      const failed = items.filter(([, r]) => r.status === 'fail')
      const skipped = items.filter(([, r]) => r.status === 'skip')
      const passed = items.filter(([, r]) => r.status === 'pass')
      if(failed.length) {
        cells.push('FAIL ' + failed[0][0].slice(suite.length + 1) + ': ' + (failed[0][1].error || '').split('\n')[0].slice(0, 50))
      } else if(passed.length && skipped.length) {
        cells.push('pass (' + skipped.length + ' skip)')
      } else if(passed.length) {
        cells.push('pass')
      } else if(skipped.length) {
        cells.push('skip')
      } else {
        cells.push('')
      }
    }
    return cells
  })
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i] || '').length)))
  const line = (cols) => cols.map((c, i) => pad(c, widths[i])).join('  ')
  return [line(headers), line(widths.map(w => '-'.repeat(w))), ...rows.map(line)].join('\n')
}

export function formatBench(backendResults) {
  const lines = ['', 'benchmarks', '----------']
  for(const backend of backendResults) {
    const bench = Object.entries(backend.results).filter(([id, r]) => id.startsWith('bench/') && r.metrics)
    if(!bench.length) continue
    lines.push(backend.name)
    for(const [, r] of bench) {
      for(const [name, m] of Object.entries(r.metrics)) {
        if(!m || typeof m !== 'object' || Array.isArray(m)) continue
        if(m.ops == null && m.p50 == null && m.p99 == null && m.max == null && m.rss == null && m.disk == null) {
          continue
        }
        const ops = m.ops != null ? m.ops.toFixed(0) + ' ops/s' : ''
        const p50 = m.p50 != null ? ' p50=' + m.p50.toFixed(2) + 'ms' : ''
        const p99 = m.p99 != null ? ' p99=' + m.p99.toFixed(2) + 'ms' : ''
        const max = m.max != null ? ' max=' + m.max.toFixed(2) + 'ms' : ''
        const rss = m.rss != null ? ' rss=' + (m.rss / 1024 / 1024).toFixed(1) + 'MiB' : ''
        const disk = m.disk != null ? ' disk=' + (m.disk / 1024 / 1024).toFixed(1) + 'MiB' : ''
        lines.push('  ' + name + ': ' + ops + p50 + p99 + max + rss + disk)
      }
    }
  }
  return lines.join('\n')
}

function fmtMs(v) {
  if(v == null || !Number.isFinite(Number(v))) return ''
  const n = Number(v)
  if(n >= 60000) return (n / 60000).toFixed(1) + 'min'
  if(n >= 1000) return (n / 1000).toFixed(2) + 's'
  return n.toFixed(2) + 'ms'
}

function fmtOps(v) {
  if(v == null || !Number.isFinite(Number(v))) return ''
  return Number(v).toFixed(0)
}

function fmtMiB(v) {
  if(v == null || !Number.isFinite(Number(v))) return ''
  return (Number(v) / 1024 / 1024).toFixed(1) + 'MiB'
}

export function fragmentationEntries(backendResults) {
  const out = []
  for(const backend of backendResults) {
    const result = backend.results && backend.results['bench/fragmentation']
    if(!result) continue
    out.push({ name: backend.name, available: backend.available, result })
  }
  return out
}

export function formatFragmentation(backendResults) {
  const entries = fragmentationEntries(backendResults)
  if(!entries.length) return ''
  const headers = [
    'backend',
    'fill ops/s',
    'delete',
    'large p50',
    'large p99',
    'large max',
    'steady p50',
    'steady p99',
    'steady max',
    'disk'
  ]
  const rows = entries.map(({ name, available, result }) => {
    if(!available) return [name, 'unavailable', '', '', '', '', '', '', '', '']
    if(result.status === 'skip') {
      return [name, 'skip', result.skipReason || '', '', '', '', '', '', '', '']
    }
    if(result.status !== 'pass' || !result.metrics) {
      return [name, result.status || 'fail', (result.error || '').split('\n')[0].slice(0, 40), '', '', '', '', '', '', '']
    }
    const m = result.metrics
    return [
      name,
      fmtOps(m.fill && m.fill.ops),
      fmtMs(m.delete && m.delete.totalMs),
      fmtMs(m.largePut && m.largePut.p50),
      fmtMs(m.largePut && m.largePut.p99),
      fmtMs(m.largePut && m.largePut.max),
      fmtMs(m.steady && m.steady.p50),
      fmtMs(m.steady && m.steady.p99),
      fmtMs(m.steady && m.steady.max),
      fmtMiB(m.diskFinal)
    ]
  })
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i] || '').length)))
  const line = (cols) => cols.map((c, i) => pad(c, widths[i])).join('  ')
  return ['', 'fragmentation', '-------------', line(headers), line(widths.map(w => '-'.repeat(w))), ...rows.map(line)].join('\n')
}

export function fragmentationMarkdownTable(backendResults) {
  const entries = fragmentationEntries(backendResults)
  if(!entries.length) return ''
  const headers = [
    'backend',
    'fill ops/s',
    'delete',
    'large p50',
    'large p99',
    'large max',
    'steady p50',
    'steady p99',
    'steady max',
    'disk'
  ]
  const rows = entries.map(({ name, available, result }) => {
    if(!available) return [name, 'unavailable', '', '', '', '', '', '', '', '']
    if(result.status === 'skip') return [name, 'skip', '', '', '', '', '', '', '', '']
    if(result.status !== 'pass' || !result.metrics) {
      return [name, result.status || 'fail', '', '', '', '', '', '', '', '']
    }
    const m = result.metrics
    return [
      name,
      fmtOps(m.fill && m.fill.ops),
      fmtMs(m.delete && m.delete.totalMs),
      fmtMs(m.largePut && m.largePut.p50),
      fmtMs(m.largePut && m.largePut.p99),
      fmtMs(m.largePut && m.largePut.max),
      fmtMs(m.steady && m.steady.p50),
      fmtMs(m.steady && m.steady.p99),
      fmtMs(m.steady && m.steady.max),
      fmtMiB(m.diskFinal)
    ]
  })
  const esc = (c) => String(c || '').replace(/\|/g, '\\|')
  return [
    '| ' + headers.join(' | ') + ' |',
    '| ' + headers.map(() => '---').join(' | ') + ' |',
    ...rows.map(r => '| ' + r.map(esc).join(' | ') + ' |')
  ].join('\n')
}

export function writeFragmentationCsv(report, outDir) {
  const backends = (report && report.backends) || []
  const written = []
  fs.mkdirSync(outDir, { recursive: true })
  for(const backend of backends) {
    const result = backend.results && backend.results['bench/fragmentation']
    const csv = result && result.metrics && result.metrics.timeseriesCsv
    if(!csv) continue
    const file = path.join(outDir, 'fragmentation-timeseries-' + backend.name + '.csv')
    fs.writeFileSync(file, csv)
    written.push(file)
  }
  return written
}

function fmtSlope(v) {
  if(v == null || !Number.isFinite(Number(v))) return ''
  const n = Number(v)
  const abs = Math.abs(n)
  if(abs >= 1) return n.toFixed(2) + 'ms/i'
  if(abs >= 0.01) return n.toFixed(3) + 'ms/i'
  return n.toExponential(1) + 'ms/i'
}

function churnOverwrite(metrics) {
  return metrics && metrics.churn && metrics.churn.largeOverwrite
}

export function churnEntries(backendResults) {
  const out = []
  for(const backend of backendResults) {
    const result = backend.results && backend.results['bench/churn']
    if(!result) continue
    out.push({ name: backend.name, available: backend.available, result })
  }
  return out
}

function churnRow(name, available, result) {
  if(!available) {
    return [name, 'unavailable', '', '', '', '', '', '', '', '', '']
  }
  if(result.status === 'skip') {
    return [name, 'skip', result.skipReason || '', '', '', '', '', '', '', '', '']
  }
  if(result.status !== 'pass' || !result.metrics) {
    return [name, result.status || 'fail', (result.error || '').split('\n')[0].slice(0, 40), '', '', '', '', '', '', '', '']
  }
  const m = result.metrics
  const ow = churnOverwrite(m)
  const pinnedMax = m.pinned && m.pinned.largeOverwrite && m.pinned.largeOverwrite.max
  const pinnedCell = m.pinned && m.pinned.skipped ? 'skip' : fmtMs(pinnedMax)
  return [
    name,
    fmtMs(ow && ow.p50),
    fmtMs(ow && ow.p99),
    fmtMs(ow && ow.max),
    fmtSlope(m.churn && m.churn.slopeMsPerCycle),
    fmtMs(m.pressure && m.pressure.p50),
    fmtMs(m.pressure && m.pressure.p99),
    fmtMs(m.pressure && m.pressure.max),
    fmtSlope(m.pressure && m.pressure.slopeMsPerIter),
    pinnedCell,
    fmtMiB(m.diskFinal)
  ]
}

const CHURN_HEADERS = [
  'backend',
  'churn p50',
  'churn p99',
  'churn max',
  'slope',
  'pressure p50',
  'pressure p99',
  'pressure max',
  'pslope',
  'pinned max',
  'disk'
]

export function formatChurn(backendResults) {
  const entries = churnEntries(backendResults)
  if(!entries.length) return ''
  const rows = entries.map(({ name, available, result }) => churnRow(name, available, result))
  const widths = CHURN_HEADERS.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i] || '').length)))
  const line = (cols) => cols.map((c, i) => pad(c, widths[i])).join('  ')
  return ['', 'churn', '-----', line(CHURN_HEADERS), line(widths.map(w => '-'.repeat(w))), ...rows.map(line)].join('\n')
}

export function churnMarkdownTable(backendResults) {
  const entries = churnEntries(backendResults)
  if(!entries.length) return ''
  const rows = entries.map(({ name, available, result }) => {
    const row = churnRow(name, available, result)
    if(row[1] === 'skip' && result.skipReason) {
      return [name, 'skip', '', '', '', '', '', '', '', '', '']
    }
    return row
  })
  const esc = (c) => String(c || '').replace(/\|/g, '\\|')
  return [
    '| ' + CHURN_HEADERS.join(' | ') + ' |',
    '| ' + CHURN_HEADERS.map(() => '---').join(' | ') + ' |',
    ...rows.map(r => '| ' + r.map(esc).join(' | ') + ' |')
  ].join('\n')
}

export function writeChurnCsv(report, outDir, suffix = '') {
  const backends = (report && report.backends) || []
  const written = []
  fs.mkdirSync(outDir, { recursive: true })
  const extra = suffix ? '-' + suffix : ''
  for(const backend of backends) {
    const result = backend.results && backend.results['bench/churn']
    const csv = result && result.metrics && result.metrics.timeseriesCsv
    if(!csv) continue
    const file = path.join(outDir, 'churn-timeseries-' + backend.name + extra + '.csv')
    fs.writeFileSync(file, csv)
    written.push(file)
  }
  return written
}

export function writeReport(outPath, payload) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
}

export function summarize(backendResults) {
  let failed = 0
  let passed = 0
  let skipped = 0
  for(const backend of backendResults) {
    for(const r of Object.values(backend.results)) {
      if(r.status === 'fail') failed++
      else if(r.status === 'pass') passed++
      else if(r.status === 'skip') skipped++
    }
  }
  return { failed, passed, skipped }
}
