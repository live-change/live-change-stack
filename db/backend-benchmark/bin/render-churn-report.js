#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import {
  churnEntries,
  churnMarkdownTable,
  writeChurnCsv
} from '../lib/report.js'
import { packageRoot } from '../lib/suites.js'
import {
  colorFor,
  parseCsv,
  downsample,
  panelChart,
  fmtMsTick,
  fmtMiBTick,
  legend
} from '../lib/svgChart.js'

function parametersFrom(entries) {
  for(const e of entries) {
    const p = e.result && e.result.metrics && e.result.metrics.parameters
    if(p) return p
  }
  return null
}

function isoDate() {
  return new Date().toISOString()
}

function seriesFromPhase(parsedByBackend, phase, field) {
  const names = Object.keys(parsedByBackend)
  const series = []
  let yMax = 1
  for(const name of names) {
    const rows = parsedByBackend[name].filter(r => r.phase === phase)
    const points = rows.map(r => ({ y: r[field] }))
    series.push({ name, color: colorFor(name), points })
    for(const p of points) {
      if(Number.isFinite(p.y) && p.y > yMax) yMax = p.y
    }
  }
  return { names, series, yMax }
}

function latencyChart(parsedByBackend, phase, title, subtitle) {
  const { names, series, yMax } = seriesFromPhase(parsedByBackend, phase, 'op_ms')
  const width = 960
  const panelW = 860
  const panelH = 280
  const x0 = 70
  const y0 = 50
  const height = 50 + panelH + 40
  const body = panelChart({
    title: subtitle,
    series: series.map(s => ({ ...s, points: downsample(s.points, 240) })),
    x0,
    y0,
    width: panelW,
    height: panelH,
    logScale: true,
    yMin: 0.05,
    yMax: Math.max(yMax, 10),
    yTickFormat: fmtMsTick
  })
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<text x="20" y="24" font-size="16" font-family="sans-serif" fill="#0f172a">${title}</text>`,
    legend(names, 20, height - 12),
    body,
    `</svg>`
  ].join('\n')
}

function diskChart(parsedByBackend) {
  const names = Object.keys(parsedByBackend)
  const series = []
  let yMax = 1
  for(const name of names) {
    const points = parsedByBackend[name]
      .filter(r => r.disk_bytes > 0)
      .map(r => ({ y: r.disk_bytes }))
    series.push({ name, color: colorFor(name), points: downsample(points, 200) })
    for(const p of points) {
      if(p.y > yMax) yMax = p.y
    }
  }
  const width = 960
  const panelW = 860
  const panelH = 280
  const x0 = 70
  const y0 = 50
  const height = 50 + panelH + 40
  const body = panelChart({
    title: 'On-disk size (sampled)',
    series,
    x0,
    y0,
    width: panelW,
    height: panelH,
    logScale: false,
    yMin: 0,
    yMax: yMax * 1.05,
    yTickFormat: fmtMiBTick
  })
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<text x="20" y="24" font-size="16" font-family="sans-serif" fill="#0f172a">Disk usage during churn</text>`,
    legend(names, 20, height - 12),
    body,
    `</svg>`
  ].join('\n')
}

function interpretBackend(name, result) {
  if(!result) return `**${name}** — brak wyniku.`
  if(result.status === 'skip') {
    return `**${name}** — pominięty (${result.skipReason || 'brak capability'}).`
  }
  if(result.status !== 'pass' || !result.metrics) {
    return `**${name}** — ${result.status}: ${(result.error || 'brak metrics').split('\n')[0]}`
  }
  const m = result.metrics
  const ow = m.churn && m.churn.largeOverwrite
  const slope = m.churn && m.churn.slopeMsPerCycle
  const pressure = m.pressure
  const notes = []
  if(ow && ow.max >= 60000) {
    notes.push(`max overwrite ${fmtMsTick(ow.max)} — skala, która wywala bot-server.`)
  } else if(ow && ow.max >= 5000) {
    notes.push(`max overwrite ${fmtMsTick(ow.max)} — odczuwalne zacinanie, jeszcze nie minuty.`)
  } else if(ow) {
    notes.push(`max overwrite ${fmtMsTick(ow.max)} — poniżej progu „kilka minut”.`)
  }
  if(slope != null && slope > 0.05) {
    notes.push(`Churn slope ${slope.toFixed(3)} ms/cykl — latency rośnie z liczbą pętli fill/delete.`)
  } else if(slope != null && slope < -0.05) {
    notes.push(`Churn slope ${slope.toFixed(3)} ms/cykl — latency spada (warmup/compaction).`)
  } else {
    notes.push('Churn slope ≈ 0 — na tej skali nie widać narastania.')
  }
  if(pressure && pressure.slopeMsPerIter > 0.2) {
    notes.push(`Pressure slope ${pressure.slopeMsPerIter.toFixed(3)} ms/iter — duże puty pod churnem degradują.`)
  }
  if(m.pinned && m.pinned.skipped) {
    notes.push('Pinned reader pominięty: ' + m.pinned.skipped + '.')
  } else if(m.pinned && m.pinned.largeOverwrite) {
    const pmax = m.pinned.largeOverwrite.max
    if(ow && pmax > ow.max * 1.5 && pmax > 100) {
      notes.push(`Pinned reader podniósł max do ${fmtMsTick(pmax)} — wolne strony nie wracają do allocatora.`)
    } else {
      notes.push(`Pinned reader max ${fmtMsTick(pmax)} — bez silnego dodatkowego kosztu na tej skali.`)
    }
  }
  if(name === 'lmdb') {
    notes.push('LMDB: wspólny freeDB dla 24 DBI, first-fit na overflow (1 MiB = 256 stron).')
  } else if(name === 'sqlite') {
    notes.push('SQLite: overflow to linked-list, nie wymaga ciągłego runu stron.')
  } else if(name === 'rocksdb' || name === 'leveldb') {
    notes.push('LSM: brak reuse stron — wzrost to compaction / write amplification.')
  } else if(name === 'memory') {
    notes.push('Memory (RB-tree) — kontrola bez trwałego allocatora stron.')
  }
  return `**${name}** — ${notes.join(' ')}`
}

function conclusions(entries) {
  const passed = entries.filter(e => e.result && e.result.status === 'pass' && e.result.metrics)
  if(!passed.length) return 'Brak udanych przebiegów — nie da się porównać backendów.'
  const ranked = [...passed].sort((a, b) => {
    const am = (a.result.metrics.churn && a.result.metrics.churn.largeOverwrite && a.result.metrics.churn.largeOverwrite.max) || 0
    const bm = (b.result.metrics.churn && b.result.metrics.churn.largeOverwrite && b.result.metrics.churn.largeOverwrite.max) || 0
    return am - bm
  })
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const growing = passed.filter(e => (e.result.metrics.churn && e.result.metrics.churn.slopeMsPerCycle) > 0.05)
  const minuteClass = passed.filter(e => {
    const max = e.result.metrics.churn && e.result.metrics.churn.largeOverwrite && e.result.metrics.churn.largeOverwrite.max
    return max >= 60000
  })
  const lines = []
  lines.push(
    `Najniższy max overwrite: **${best.name}** (${fmtMsTick(best.result.metrics.churn.largeOverwrite.max)}).`
  )
  lines.push(
    `Najwyższy max overwrite: **${worst.name}** (${fmtMsTick(worst.result.metrics.churn.largeOverwrite.max)}).`
  )
  if(growing.length) {
    lines.push(
      'Backendy z dodatnim slope churnu (latency rośnie z cyklami): ' +
      growing.map(e => e.name + ' (' + e.result.metrics.churn.slopeMsPerCycle.toFixed(3) + ' ms/cykl)').join(', ') + '.'
    )
  } else {
    lines.push('Żaden backend nie pokazał wyraźnego wzrostu latency vs liczba cykli (slope ≤ 0.05 ms/cykl).')
  }
  if(minuteClass.length) {
    lines.push('Backendy z latency w skali minut: ' + minuteClass.map(e => e.name).join(', ') + '.')
  } else {
    lines.push(
      'Żaden backend nie osiągnął kilkuminutowego put. Hipoteza minutowego LMDB wymaga większego K albo większego value (więcej ciągłych overflow pages).'
    )
  }
  return lines.map(l => '- ' + l).join('\n')
}

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name)
  if(i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1]
  }
  return fallback
}

function main() {
  const root = packageRoot()
  const suffix = arg('suffix', '')
  const extra = suffix ? '-' + suffix : ''
  const reportArg = arg('report', 'report.json')
  const reportPath = path.isAbsolute(reportArg) ? reportArg : path.join(root, reportArg)
  if(!fs.existsSync(reportPath)) {
    console.error('Missing ' + reportPath + ' — run npm run churn first')
    process.exit(1)
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  writeChurnCsv(report, root, suffix)

  const entries = churnEntries(report.backends || [])
  const parsedByBackend = {}
  for(const e of entries) {
    const csv = e.result && e.result.metrics && e.result.metrics.timeseriesCsv
    if(!csv) continue
    parsedByBackend[e.name] = parseCsv(csv)
  }

  const churnPath = path.join(root, 'churn-chart-overwrite' + extra + '.svg')
  const pressurePath = path.join(root, 'churn-chart-pressure' + extra + '.svg')
  const diskPath = path.join(root, 'churn-chart-disk' + extra + '.svg')
  const mdName = suffix ? 'churn-report-' + suffix + '.md' : 'churn-report.md'
  fs.writeFileSync(churnPath, latencyChart(
    parsedByBackend,
    'churn',
    'Churn large-overwrite latency (log scale)',
    '1 MiB overwrite per cycle under fill/delete'
  ))
  fs.writeFileSync(pressurePath, latencyChart(
    parsedByBackend,
    'pressure',
    'Pressure 1 MiB put latency (log scale)',
    'Large put interleaved with small puts and single deletes'
  ))
  fs.writeFileSync(diskPath, diskChart(parsedByBackend))

  const params = parametersFrom(entries)
  const size = report.size
  const md = []
  md.push('# Churn fragmentation benchmark — raport' + (suffix ? ' ' + suffix : ''))
  md.push('')
  md.push('Data: ' + isoDate())
  md.push('')
  md.push('## Parametry')
  md.push('')
  if(params) {
    md.push('| parametr | wartość |')
    md.push('| --- | --- |')
    md.push('| `--size` | ' + size + ' |')
    md.push('| stores | ' + params.stores + ' |')
    md.push('| prefill / store | ' + params.prefillPerStore + ' |')
    md.push('| prefill total | ' + params.prefillTotal + ' |')
    md.push('| cycles | ' + params.cycles + ' |')
    md.push('| pinned cycles | ' + params.pinnedCycles + ' |')
    md.push('| small payload | ' + params.smallMin + '–' + params.smallMax + ' B |')
    md.push('| large payload | ' + params.largeBytes + ' B (1 MiB) |')
    md.push('| small puts / store / cykl | ' + params.smallPutsPerStore + ' |')
    md.push('| single deletes / store / cykl | ' + params.deletesPerStore + ' |')
    md.push('| TTL prune / cykl | ' + params.ttlLimit + ' |')
    md.push('| pressure iters | ' + params.pressureIters + ' |')
    md.push('| fill payload | ' + (params.fillBytes != null
      ? (params.fillBytes / 1024 / 1024).toFixed(1) + ' MiB'
      : '') + ' |')
  } else {
    md.push('Brak `metrics.parameters` w JSON.')
  }
  md.push('')
  md.push('## Co testowane i po co')
  md.push('')
  md.push('`bench/fragmentation` nie łapał wzrostu latency: jeden store, prune ciągłego prefiksu (jedna duża dziura), batchowany `rangeDelete` i zero małych zapisów między prune a large-put.')
  md.push('')
  md.push('Ten suite celuje we wspólny freeDB / allocator przy wielu tabelach:')
  md.push('')
  md.push('1. **Prefill** — 24 named store\'y w jednym env, round-robin, monotoniczne id, 1–8 KiB.')
  md.push('2. **Churn** — K cykli: małe puty, **pojedyncze** `delete` (osobne transakcje), `rangeDelete` ze środka zakresu, TTL-prune najstarszych, mierzony overwrite 1 MiB pod stałym kluczem.')
  md.push('3. **Pressure** — 1 MiB put przeplatany małym churnem. Slope mówi, czy latency **rośnie**, nie tylko jaki jest max.')
  md.push('4. **Pinned reader** — długo żyjący read txn (LMDB; SQLite jeśli się uda przy EXCLUSIVE lock) — strony zwolnione po nim nie wracają do allocatora.')
  md.push('')
  md.push('## Podsumowanie liczb')
  md.push('')
  md.push(churnMarkdownTable(report.backends || []) || '_brak wyników churn_')
  md.push('')
  md.push('## Latency overwrite vs cykl')
  md.push('')
  md.push('Oś Y logarytmiczna. Szukamy **slope**, nie pojedynczego max.')
  md.push('')
  md.push('![Churn overwrite](./churn-chart-overwrite' + extra + '.svg)')
  md.push('')
  md.push('## Pressure (duży put pod churnem)')
  md.push('')
  md.push('![Pressure](./churn-chart-pressure' + extra + '.svg)')
  md.push('')
  md.push('## Disk w czasie')
  md.push('')
  md.push('![Disk usage](./churn-chart-disk' + extra + '.svg)')
  md.push('')
  md.push('## Interpretacja per backend')
  md.push('')
  for(const e of entries) {
    md.push(interpretBackend(e.name, e.result))
    md.push('')
  }
  md.push('## Wnioski')
  md.push('')
  md.push(conclusions(entries))
  md.push('')
  md.push('## Artefakty')
  md.push('')
  md.push('- `' + path.basename(reportPath) + '` — pełny wynik runnera (`metrics` + osadzony CSV)')
  md.push('- `churn-timeseries-<backend>' + extra + '.csv` — time-series per backend')
  md.push('- `churn-chart-overwrite' + extra + '.svg`, `churn-chart-pressure' + extra + '.svg`, `churn-chart-disk' + extra + '.svg`')
  md.push('- ten plik: `' + mdName + '`')
  md.push('')

  const mdPath = path.join(root, mdName)
  fs.writeFileSync(mdPath, md.join('\n'))
  console.log('Wrote ' + mdPath)
  console.log('Wrote ' + churnPath)
  console.log('Wrote ' + pressurePath)
  console.log('Wrote ' + diskPath)
}

main()
