#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { resolveBackends, defaultTimeout } from '../lib/capabilities.js'
import { isolateProbe, isolateRun, isolateWriteKillReopen } from '../lib/isolate.js'
import { formatTable, formatBench, formatFragmentation, writeFragmentationCsv, formatChurn, writeChurnCsv, writeReport, summarize } from '../lib/report.js'
import { packageRoot, resolveSuites, listSuiteFiles, SUITE_NAMES } from '../lib/suites.js'

const argv = yargs(hideBin(process.argv))
  .scriptName('lc-db-backend-benchmark')
  .option('backend', {
    type: 'string',
    default: 'lmdb,memory',
    describe: 'comma-separated backends or all (lmdb, memory, leveldb, memdown, rocksdb, sqlite)'
  })
  .option('suite', {
    type: 'string',
    default: 'wiring,contract,consistency,durability,table',
    describe: 'comma-separated suites or all (' + SUITE_NAMES.join(', ') + ')'
  })
  .option('timeout', {
    type: 'number',
    describe: 'override per-file timeout in ms'
  })
  .option('keep', {
    type: 'boolean',
    default: false,
    describe: 'keep tmp directories'
  })
  .option('strict', {
    type: 'boolean',
    default: false,
    describe: 'missing capabilities fail instead of skip'
  })
  .option('json', {
    type: 'string',
    default: 'report.json',
    describe: 'write JSON report path (relative to package)'
  })
  .option('size', {
    type: 'number',
    default: 10000,
    describe: 'N for bench/stress'
  })
  .option('map-size', {
    type: 'number',
    describe: 'backend mapSize / sqlite mmap_size in bytes'
  })
  .help()
  .parse()

async function loadProtocol(file) {
  try {
    const mod = await import(pathToFileURLIfNeeded(file))
    return mod.protocol || 'default'
  } catch(e) {
    return 'default'
  }
}

function csvSuffixFromJson(jsonPath) {
  const stem = path.basename(jsonPath, '.json')
  if(stem === 'report') return ''
  const m = stem.match(/(\d+)$/)
  return m ? m[1] : stem
}

function pathToFileURLIfNeeded(file) {
  return pathToFileURL(file).href
}

async function main() {
  const root = packageRoot()
  if(!argv.keep) {
    fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })
  }
  const backends = resolveBackends(argv.backend)
  const suites = resolveSuites(argv.suite)
  const files = listSuiteFiles(suites)
  const backendResults = []

  for(const backendName of backends) {
    const probeTmp = path.join(root, 'tmp', 'probe-' + backendName + '-' + process.pid)
    const probeResult = path.join(root, 'tmp', 'probe-' + backendName + '.json')
    const probed = await isolateProbe({
      backendName,
      tmpDir: probeTmp,
      resultPath: probeResult
    })
    const entry = {
      name: backendName,
      available: probed.available,
      reason: probed.reason || '',
      results: {}
    }
    backendResults.push(entry)
    if(!probed.available) {
      console.log('[probe] ' + backendName + ' unavailable: ' + (probed.reason || '').split('\n')[0])
      continue
    }
    console.log('[probe] ' + backendName + ' available')

    for(const file of files) {
      const timeoutMs = argv.timeout || defaultTimeout(file.suite)
      const tmpDir = path.join(root, 'tmp', backendName + '-' + file.id.replace(/\//g, '_') + '-' + process.pid)
      const resultPath = path.join(root, 'tmp', 'result-' + backendName + '-' + file.id.replace(/\//g, '_') + '.json')
      process.stdout.write('[run] ' + backendName + ' ' + file.id + ' ... ')
      const liveProgress = argv.size >= 100000 || file.id === 'bench/churn'
      if(liveProgress) process.stdout.write('\n')
      const protocol = await loadProtocol(file.file)
      let result
      if(protocol === 'write-kill-reopen') {
        result = await isolateWriteKillReopen({
          backendName,
          file: file.file,
          tmpDir,
          resultPath,
          size: argv.size,
          mapSize: argv.mapSize,
          strict: argv.strict,
          keep: argv.keep,
          timeoutMs,
          progress: liveProgress
        })
      } else {
        result = await isolateRun({
          backendName,
          file: file.file,
          tmpDir,
          resultPath,
          size: argv.size,
          mapSize: argv.mapSize,
          strict: argv.strict,
          keep: argv.keep,
          timeoutMs,
          progress: liveProgress
        })
      }
      entry.results[file.id] = result
      if(result.status === 'pass') console.log('pass')
      else if(result.status === 'skip') console.log('skip ' + (result.skipReason || ''))
      else console.log('FAIL ' + (result.error || '').split('\n')[0])
    }
  }

  const tableSuites = [...new Set(files.map(f => f.suite))]
  console.log('')
  console.log(formatTable(backendResults, tableSuites.length ? tableSuites : suites))
  const benchText = formatBench(backendResults)
  if(benchText.trim()) console.log(benchText)
  const fragText = formatFragmentation(backendResults)
  if(fragText.trim()) console.log(fragText)
  const churnText = formatChurn(backendResults)
  if(churnText.trim()) console.log(churnText)

  const jsonPath = path.isAbsolute(argv.json) ? argv.json : path.join(root, argv.json)
  writeReport(jsonPath, {
    backends: backendResults,
    suites,
    size: argv.size,
    strict: argv.strict
  })
  console.log('\nJSON report: ' + jsonPath)
  const csvFiles = [
    ...writeFragmentationCsv({ backends: backendResults }, root),
    ...writeChurnCsv({ backends: backendResults }, root, csvSuffixFromJson(jsonPath))
  ]
  for(const file of csvFiles) {
    console.log('CSV: ' + file)
  }

  const { failed, passed, skipped } = summarize(backendResults)
  console.log('\n' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped')
  if(failed > 0) process.exit(1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
