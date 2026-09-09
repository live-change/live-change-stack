import fs from 'fs'
import { pathToFileURL } from 'url'
import { Session } from './session.js'
import { createAssert } from './assert.js'
import { capabilitiesFor } from './capabilities.js'

const originalExit = process.exit.bind(process)

process.exit = (code) => {
  throw new Error('process.exit(' + code + ')')
}

process.on('unhandledRejection', (reason) => {
  failAndExit(reason)
})

process.on('uncaughtException', (err) => {
  failAndExit(err)
})

function writeResult(payload) {
  const resultPath = process.env.LC_BENCH_RESULT
  fs.writeFileSync(resultPath, JSON.stringify(payload, null, 2))
}

function failAndExit(err) {
  try {
    writeResult({
      status: 'fail',
      error: err && (err.stack || err.message || String(err))
    })
  } catch(e) {}
  originalExit(1)
}

async function main() {
  const backendName = process.env.LC_BENCH_BACKEND
  const file = process.env.LC_BENCH_FILE
  const tmpDir = process.env.LC_BENCH_TMP
  const size = Number(process.env.LC_BENCH_SIZE || 10000)
  const strict = process.env.LC_BENCH_STRICT === '1'
  const keep = process.env.LC_BENCH_KEEP === '1'
  const phase = process.env.LC_BENCH_PHASE || 'run'
  const capabilities = capabilitiesFor(backendName)
  const suite = await import(pathToFileURL(file).href)

  const required = suite.capabilities || []
  const missing = required.filter(cap => !capabilities[cap])
  if(missing.length) {
    if(strict) {
      writeResult({
        status: 'fail',
        error: 'missing capabilities: ' + missing.join(', ')
      })
      originalExit(1)
      return
    }
    writeResult({
      status: 'skip',
      skipReason: 'missing capabilities: ' + missing.join(', ')
    })
    originalExit(0)
    return
  }

  const skipIf = suite.skipIf || []
  if(skipIf.includes(backendName)) {
    writeResult({ status: 'skip', skipReason: 'skipped for backend ' + backendName })
    originalExit(0)
    return
  }

  const mapSize = process.env.LC_BENCH_MAP_SIZE
    ? Number(process.env.LC_BENCH_MAP_SIZE)
    : undefined
  const session = new Session({ backendName, tmpDir, mapSize })
  const { assert, results } = createAssert()
  const ctx = {
    backendName,
    capabilities,
    strict,
    size,
    tmpDir,
    session,
    assert,
    phase
  }

  const layer = suite.layer || 'store'
  try {
    if(phase === 'write') {
      session.open()
      if(layer === 'store') ctx.store = session.createStore('data')
      if(layer === 'table') ctx.database = session.createDatabase()
      if(typeof suite.write !== 'function') throw new Error('suite.write required for write phase')
      await suite.write(ctx)
      writeResult({ status: 'ready' })
      setInterval(() => {}, 1 << 30)
      await new Promise(() => {})
      return
    }

    if(phase === 'verify') {
      session.open()
      if(layer === 'store') ctx.store = session.createStore('data')
      if(layer === 'table') ctx.database = session.createDatabase()
      if(typeof suite.verify !== 'function') throw new Error('suite.verify required for verify phase')
      await suite.verify(ctx)
      writeResult({ status: 'pass', tests: results })
      originalExit(0)
      return
    }

    if(layer !== 'none') session.open()
    if(layer === 'store') ctx.store = session.createStore('data')
    if(layer === 'table') ctx.database = session.createDatabase()

    await suite.run(ctx)
    writeResult({
      status: 'pass',
      tests: results,
      metrics: ctx.metrics || undefined,
      notes: ctx.notes || undefined
    })
    originalExit(0)
  } catch(err) {
    writeResult({
      status: 'fail',
      error: err && (err.stack || err.message || String(err)),
      tests: results,
      metrics: ctx.metrics || undefined
    })
    originalExit(1)
  } finally {
    try {
      await session.close({ keep })
    } catch(e) {}
  }
}

main().catch(failAndExit)
