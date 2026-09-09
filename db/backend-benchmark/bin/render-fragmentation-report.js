#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import {
  fragmentationEntries,
  fragmentationMarkdownTable,
  writeFragmentationCsv
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

function latencySvg(parsedByBackend) {
  const names = Object.keys(parsedByBackend)
  const fillSeries = []
  const largeSeries = []
  const steadySeries = []
  let yMax = 1
  for(const name of names) {
    const rows = parsedByBackend[name]
    const fill = downsample(rows.filter(r => r.phase === 'fill').map(r => ({ y: r.op_ms })), 120)
    const large = rows.filter(r => r.phase === 'large-put').map(r => ({ y: r.op_ms }))
    const steady = rows.filter(r => r.phase === 'steady').map(r => ({ y: r.op_ms }))
    fillSeries.push({ name, color: colorFor(name), points: fill })
    largeSeries.push({ name, color: colorFor(name), points: large })
    steadySeries.push({ name, color: colorFor(name), points: steady })
    for(const p of [...fill, ...large, ...steady]) {
      if(p.y > yMax) yMax = p.y
    }
  }
  const width = 960
  const panelW = 860
  const panelH = 160
  const x0 = 70
  const height = 40 + 30 + 3 * (panelH + 40)
  const yMin = 0.05
  const panels = [
    { title: 'Fill (small puts, downsampled)', series: fillSeries, y0: 50 },
    { title: 'Large put (1 MiB) after 10% prune', series: largeSeries, y0: 50 + panelH + 40 },
    { title: 'Steady-state (1 MiB put + delete oldest large)', series: steadySeries, y0: 50 + 2 * (panelH + 40) }
  ]
  const body = panels.map(p => panelChart({
    title: p.title,
    series: p.series,
    x0,
    y0: p.y0,
    width: panelW,
    height: panelH,
    logScale: true,
    yMin,
    yMax: Math.max(yMax, 10),
    yTickFormat: fmtMsTick
  })).join('\n')
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<text x="20" y="24" font-size="16" font-family="sans-serif" fill="#0f172a">Put latency over time (log scale)</text>`,
    legend(names, 20, height - 12),
    body,
    `</svg>`
  ].join('\n')
}

function diskSvg(parsedByBackend) {
  const names = Object.keys(parsedByBackend)
  const series = []
  let yMax = 1
  for(const name of names) {
    const points = parsedByBackend[name]
      .filter(r => r.disk_bytes > 0)
      .map(r => ({ y: r.disk_bytes }))
    series.push({ name, color: colorFor(name), points: downsample(points, 160) })
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
    return `**${name}** — pominięty (${result.skipReason || 'brak capability'}). Memory nie jest durable, więc nie bierze udziału w teście fragmentacji.`
  }
  if(result.status !== 'pass' || !result.metrics) {
    return `**${name}** — ${result.status}: ${(result.error || 'brak metrics').split('\n')[0]}`
  }
  const m = result.metrics
  const max = m.largePut && m.largePut.max
  const p99 = m.largePut && m.largePut.p99
  const steadyMax = m.steady && m.steady.max
  const notes = []
  if(max >= 60000) {
    notes.push(`max large-put ${fmtMsTick(max)} — to jest skala, która wywala bot-server (timeouty, zablokowany event loop).`)
  } else if(max >= 5000) {
    notes.push(`max large-put ${fmtMsTick(max)} — już odczuwalne jako zacinanie, ale jeszcze nie minuty.`)
  } else {
    notes.push(`max large-put ${fmtMsTick(max)} — poniżej progu „kilka minut”; put nie blokuje procesu na długo.`)
  }
  if(steadyMax != null && max != null && steadyMax > max * 1.5 && steadyMax > 100) {
    notes.push(`Steady-state max (${fmtMsTick(steadyMax)}) wyraźnie gorszy niż pierwsza seria large-put — degradacja narasta z churnem.`)
  } else if(steadyMax != null && max != null && steadyMax <= max * 1.2) {
    notes.push('Steady-state nie pogarsza się istotnie względem pierwszej serii large-put — allocator/compaction trzyma się w ryzach na tej skali.')
  }
  if(name === 'lmdb') {
    notes.push('LMDB szuka wolnych overflow pages first-fit po freeDB. Ciągłe dziury po prune najstarszych + 1 MiB value to dokładnie ten przypadek.')
  } else if(name === 'sqlite') {
    notes.push('SQLite WITHOUT ROWID + WAL + freelist. Duży value idzie do overflow pages; reuse po DELETE powinien być tańszy niż skan LMDB.')
  } else if(name === 'rocksdb' || name === 'leveldb') {
    notes.push('LSM (memtable → SST). „Fragmentacja” objawia się compaction stall / write amplification, nie wyszukiwaniem wolnego extentu.')
  }
  if(p99 != null && max != null && max > p99 * 5 && max > 1000) {
    notes.push(`Ogromny ogon: max jest ${ (max / p99).toFixed(0) }× p99 — pojedyncze puty są katastrofalne, mediana może wyglądać niewinnie.`)
  }
  return `**${name}** — ${notes.join(' ')}`
}

function conclusions(entries) {
  const passed = entries.filter(e => e.result && e.result.status === 'pass' && e.result.metrics)
  if(!passed.length) return 'Brak udanych przebiegów — nie da się porównać backendów.'
  const ranked = [...passed].sort((a, b) => (a.result.metrics.largePut.max || 0) - (b.result.metrics.largePut.max || 0))
  const worst = ranked[ranked.length - 1]
  const best = ranked[0]
  const minuteClass = passed.filter(e => (e.result.metrics.largePut.max || 0) >= 60000)
  const params = parametersFrom(entries)
  const fillGiB = params && params.fillBytes != null
    ? (params.fillBytes / 1024 / 1024 / 1024).toFixed(2) + ' GiB payload'
    : 'N=' + ((params && params.n) || '?')
  const lines = []
  lines.push(`Najniższy max large-put: **${best.name}** (${fmtMsTick(best.result.metrics.largePut.max)}).`)
  lines.push(`Najwyższy max large-put: **${worst.name}** (${fmtMsTick(worst.result.metrics.largePut.max)}).`)
  if(minuteClass.length) {
    lines.push(
      'Backendy z latency w skali minut (ryzyko wywalenia bot-server): ' +
      minuteClass.map(e => e.name).join(', ') + '.'
    )
  } else {
    lines.push(
      'Żaden backend nie osiągnął kilkuminutowego put na tej skali (' + fillGiB +
      ', 1 MiB value, jednorazowy prune 10% najstarszych na jednym store). ' +
      'To nie odtwarza jeszcze patologii bot-server (wiele tabel, wielokrotny churn, dziury różnych rozmiarów).'
    )
  }
  const degrading = passed.filter(e => {
    const lp = e.result.metrics.largePut.max || 0
    const st = e.result.metrics.steady.max || 0
    return st > lp * 1.5 && st > 100
  })
  if(degrading.length) {
    lines.push('Degradacja w steady-state: ' + degrading.map(e => e.name).join(', ') + '.')
  } else {
    lines.push('Na tej skali steady-state nie pokazał silnego narastania latency u żadnego z przebiegów pass.')
  }
  return lines.map(l => '- ' + l).join('\n')
}

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

function main() {
  const root = packageRoot()
  const reportPath = path.join(root, 'report.json')
  if(!fs.existsSync(reportPath)) {
    console.error('Missing ' + reportPath + ' — run npm run fragment first')
    process.exit(1)
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  writeFragmentationCsv(report, root)

  const entries = fragmentationEntries(report.backends || [])
  const parsedByBackend = {}
  for(const e of entries) {
    const csv = e.result && e.result.metrics && e.result.metrics.timeseriesCsv
    if(!csv) continue
    parsedByBackend[e.name] = parseCsv(csv)
  }

  const latencyPath = path.join(root, 'fragmentation-chart-latency.svg')
  const diskPath = path.join(root, 'fragmentation-chart-disk.svg')
  fs.writeFileSync(latencyPath, latencySvg(parsedByBackend))
  fs.writeFileSync(diskPath, diskSvg(parsedByBackend))

  const params = parametersFrom(entries)
  const size = report.size
  const md = []
  md.push('# Fragmentation benchmark — raport')
  md.push('')
  md.push('Data: ' + isoDate())
  md.push('')
  md.push('## Parametry')
  md.push('')
  if(params) {
    md.push('| parametr | wartość |')
    md.push('| --- | --- |')
    md.push('| `--size` | ' + size + ' |')
    md.push('| fill N | ' + params.n + ' |')
    md.push('| fill payload | ' + (params.fillBytes != null
      ? (params.fillBytes / 1024 / 1024 / 1024).toFixed(2) + ' GiB'
      : '') + ' |')
    md.push('| delete (najstarsze 10%) | ' + params.deleteCount + ' |')
    md.push('| small payload | ' + params.smallMin + '–' + params.smallMax + ' B |')
    md.push('| large payload | ' + params.largeBytes + ' B (1 MiB) |')
    md.push('| large puts | ' + params.largePuts + ' |')
    md.push('| steady iterations | ' + params.steadyIterations + ' |')
  } else {
    md.push('Brak `metrics.parameters` w report.json.')
  }
  md.push('')
  md.push('## Co testowane i po co')
  md.push('')
  md.push('W bot-serverze LMDB potrafi zablokować put na **kilka minut**, gdy baza jest po churnie: dużo małych rekordów (komendy, eventy, presence), potem kasowanie najstarszych po czasie, a następnie zapis dużego obiektu (scan/snapshot-like payload). LMDB szuka wtedy wolnych overflow pages first-fit — przy dziurawej freeDB to skan, nie O(1).')
  md.push('')
  md.push('Ten benchmark odtwarza ten cykl na jednym named store, bez aplikacji:')
  md.push('')
  md.push('1. **Fill** — monotoniczne `padId(i)`, losowy rozmiar 1–40 KiB (ten sam ciąg u wszystkich backendów, seed stały).')
  md.push('2. **Prune** — `rangeDelete({ lt: padId(N*0.1) })`, najstarsze 10%, nie losowe kasowanie. To zostawia ciągłe dziury jak TTL komend.')
  md.push('3. **Large put** — 50 obiektów 1 MiB. Mierzymy p50/p99/**max** per put. Max to to, co user czuje jako „zamuliło”.')
  md.push('4. **Steady-state** — 20× (1 MiB put + delete najstarszego dużego). Pokazuje, czy latency **rośnie w czasie**, nie tylko po jednorazowym prune.')
  md.push('')
  md.push('Skala `--size 10000` ≈ 200 MiB fill; `--size 500000` ≈ 10 GiB payload. `mapSize` / sqlite `mmap_size` idzie przez `--map-size` (skrypt `fragment:10g` ustawia 64 GiB).')
  md.push('')
  md.push('## Podsumowanie liczb')
  md.push('')
  md.push(fragmentationMarkdownTable(report.backends || []) || '_brak wyników fragmentation_')
  md.push('')
  md.push('## Latency w czasie')
  md.push('')
  md.push('Oś Y logarytmiczna — p50 bywa w milisekundach, max w sekundach/minutach. Fill jest downsamplowany, large-put i steady są pełne.')
  md.push('')
  md.push('![Put latency](./fragmentation-chart-latency.svg)')
  md.push('')
  md.push('## Disk w czasie')
  md.push('')
  md.push('Czy plik bazy wraca po prune, czy tylko rośnie. Sample w fill co 1000 ops, large-put co 5, steady co 2.')
  md.push('')
  md.push('![Disk usage](./fragmentation-chart-disk.svg)')
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
  md.push('- `report.json` — pełny wynik runnera (`metrics` + osadzony CSV)')
  md.push('- `fragmentation-timeseries-<backend>.csv` — time-series per backend')
  md.push('- `fragmentation-chart-latency.svg`, `fragmentation-chart-disk.svg`')
  md.push('- ten plik: `fragmentation-report.md`')
  md.push('')

  const mdPath = path.join(root, 'fragmentation-report.md')
  fs.writeFileSync(mdPath, md.join('\n'))
  console.log('Wrote ' + mdPath)
  console.log('Wrote ' + latencyPath)
  console.log('Wrote ' + diskPath)
}

main()
