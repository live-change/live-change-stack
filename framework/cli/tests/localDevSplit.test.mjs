import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import yargs from 'yargs'

import {
  addLocalDevSplitCommandOptions,
  buildApiFlags,
  buildChildNodeArgs,
  buildLogPaths,
  buildRoles,
  buildSsrFlags,
  createCrashloopGuard,
  formatDay,
  formatStamp,
  nextBackoffMs,
  pickStringVersion,
  runLocalDevSplit,
  waitForDaoWs,
  DEFAULT_API_MAX_OLD_SPACE_SIZE,
  DEFAULT_SSR_MAX_OLD_SPACE_SIZE,
  DEFAULT_API_INSPECT_PORT,
  DEFAULT_SSR_INSPECT_PORT,
  SSR_BACKOFF_SECONDS,
  resolveInspectPort,
  stripInspectFromNodeOptions
} from '../lib/localDevSplit.js'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function mockChild(pid) {
  const child = new EventEmitter()
  child.pid = pid
  child.stdout = new PassThrough()
  child.stderr = new PassThrough()
  child.killed = false
  child.exitCode = null
  child.signalCode = null
  child.kill = (sig) => {
    child.killed = true
    child.killedWith = sig
    child.signalCode = sig
    setImmediate(() => {
      if(child.exitCode != null) return
      child.exitCode = sig === 'SIGKILL' ? 137 : 0
      child.emit('exit', child.exitCode, sig)
    })
    return true
  }
  return child
}

test('localDevSplit yargs defaults heap sizes and does not force withApi', () => {
  const argv = addLocalDevSplitCommandOptions(yargs()).parse([])
  assert.equal(argv.apiMaxOldSpaceSize, DEFAULT_API_MAX_OLD_SPACE_SIZE)
  assert.equal(argv.ssrMaxOldSpaceSize, DEFAULT_SSR_MAX_OLD_SPACE_SIZE)
  assert.equal(argv.apiInspectPort, DEFAULT_API_INSPECT_PORT)
  assert.equal(argv.ssrInspectPort, DEFAULT_SSR_INSPECT_PORT)
  assert.equal(argv.withApi, undefined)
})

test('localDevSplit yargs accepts per-process heap overrides', () => {
  const argv = addLocalDevSplitCommandOptions(
    yargs(['--ssrMaxOldSpaceSize', '512', '--apiMaxOldSpaceSize', '1024'])
  ).parse()
  assert.equal(argv.apiMaxOldSpaceSize, 1024)
  assert.equal(argv.ssrMaxOldSpaceSize, 512)
})

test('starter localDevSplit command does not force withApi', () => {
  const src = fs.readFileSync(new URL('../lib/starter.js', import.meta.url), 'utf8')
  const start = src.indexOf(".command('localDevSplit'")
  const next = src.indexOf('.command(', start + 1)
  assert.ok(start !== -1, 'localDevSplit command exists')
  const block = src.slice(start, next === -1 ? undefined : next)
  assert.equal(block.includes('withApi: true'), false)
})

test('buildChildNodeArgs sets heap import tsx and command', () => {
  const apiArgs = buildChildNodeArgs({
    heapMb: 2048,
    startScript: '/app/server/start.js',
    cmd: 'localApiServer',
    flags: ['--enableSessions', '--dbBackend', 'rocksdb']
  })
  assert.deepEqual(apiArgs, [
    '--max-old-space-size=2048',
    '--import', 'tsx',
    '/app/server/start.js',
    'localApiServer',
    '--enableSessions',
    '--dbBackend', 'rocksdb'
  ])

  const ssrArgs = buildChildNodeArgs({
    heapMb: 512,
    startScript: '/app/server/start.js',
    cmd: 'ssrDev',
    flags: buildSsrFlags({
      enableSessions: true,
      withApi: true,
      dbBackend: 'rocksdb',
      dbAccess: true,
      apiPort: 8002,
      ssrPort: 8001
    })
  })
  assert.equal(ssrArgs.includes('ssrDev'), true)
  assert.equal(ssrArgs.includes('--withApi'), false)
  assert.equal(ssrArgs.includes('rocksdb'), false)
  assert.equal(ssrArgs.includes('--dbAccess'), false)
  assert.equal(ssrArgs.includes('--enableSessions'), true)
  assert.equal(ssrArgs.includes('--max-old-space-size=512'), true)
})

test('buildChildNodeArgs puts inspect and expose-gc before the script', () => {
  const args = buildChildNodeArgs({
    heapMb: 2048,
    startScript: '/app/server/start.js',
    cmd: 'localApiServer',
    inspectPort: 9229,
    inspectHost: '127.0.0.1'
  })
  assert.deepEqual(args.slice(0, 5), [
    '--max-old-space-size=2048',
    '--inspect=127.0.0.1:9229',
    '--expose-gc',
    '--import',
    'tsx'
  ])
  const off = buildChildNodeArgs({
    heapMb: 2048,
    startScript: '/app/server/start.js',
    cmd: 'ssrDev',
    inspectPort: null
  })
  assert.equal(off.some(arg => String(arg).startsWith('--inspect')), false)
})

test('resolveInspectPort treats 0 as disabled', () => {
  assert.equal(resolveInspectPort(undefined, 9229), 9229)
  assert.equal(resolveInspectPort(0, 9229), null)
  assert.equal(resolveInspectPort(false, 9229), null)
  assert.equal(resolveInspectPort(9231, 9229), 9231)
})

test('stripInspectFromNodeOptions removes inherited inspect flags', () => {
  assert.equal(
    stripInspectFromNodeOptions('--max-old-space-size=4096 --inspect=9229 --expose-gc'),
    '--max-old-space-size=4096 --expose-gc'
  )
  assert.equal(stripInspectFromNodeOptions('--inspect-brk'), undefined)
})

test('buildApiFlags keeps db flags and drops ssr-only flags', () => {
  const flags = buildApiFlags({
    enableSessions: true,
    dbBackend: 'rocksdb',
    dbAccess: true,
    ssrPort: 8001,
    withApi: true,
    apiMaxOldSpaceSize: 2048
  })
  assert.equal(flags.includes('--enableSessions'), true)
  assert.equal(flags.includes('--dbBackend'), true)
  assert.equal(flags.includes('--dbAccess'), true)
  assert.equal(flags.includes('--ssrPort'), false)
  assert.equal(flags.includes('--withApi'), false)
  assert.equal(flags.includes('--apiMaxOldSpaceSize'), false)
})

test('log path builder uses runner day and per-process start stamps', () => {
  const runnerStart = new Date(2026, 9, 10, 10, 42, 0)
  const serverStart = new Date(2026, 9, 10, 10, 42, 12)
  const ssrStart = new Date(2026, 9, 10, 10, 43, 1)
  const paths = buildLogPaths({
    logsRoot: '/tmp/logs',
    runnerStart,
    serverStart,
    ssrStart
  })
  assert.equal(formatDay(runnerStart), '2026-10-10')
  assert.equal(formatStamp(runnerStart), '2026-10-10T10-42-00')
  assert.equal(paths.dayDir, path.join('/tmp/logs', '2026-10-10'))
  assert.equal(paths.runnerLog, path.join('/tmp/logs', '2026-10-10', '2026-10-10T10-42-00-runner.log'))
  assert.equal(paths.serverLog, path.join('/tmp/logs', '2026-10-10', '2026-10-10T10-42-12-server.log'))
  assert.equal(paths.ssrLog, path.join('/tmp/logs', '2026-10-10', '2026-10-10T10-43-01-ssr.log'))
})

test('ssr log filename uses its own start timestamp not the server start', () => {
  const runnerStart = new Date(2026, 9, 10, 10, 0, 0)
  const first = buildLogPaths({
    logsRoot: 'logs',
    runnerStart,
    ssrStart: new Date(2026, 9, 10, 10, 1, 0)
  })
  const second = buildLogPaths({
    logsRoot: 'logs',
    runnerStart,
    ssrStart: new Date(2026, 9, 10, 11, 2, 18)
  })
  assert.notEqual(first.ssrLog, second.ssrLog)
  assert.match(second.ssrLog, /2026-10-10T11-02-18-ssr\.log$/)
})

test('backoff sequence is 1/2/5/10/30 seconds then caps', () => {
  assert.deepEqual(SSR_BACKOFF_SECONDS, [1, 2, 5, 10, 30])
  assert.equal(nextBackoffMs(0), 1000)
  assert.equal(nextBackoffMs(1), 2000)
  assert.equal(nextBackoffMs(2), 5000)
  assert.equal(nextBackoffMs(3), 10000)
  assert.equal(nextBackoffMs(4), 30000)
  assert.equal(nextBackoffMs(10), 30000)
})

test('crashloop guard trips on 3 crashes within 5s', () => {
  const guard = createCrashloopGuard({ windowMs: 5000, maxCrashes: 3 })
  assert.equal(guard.record(1000), false)
  assert.equal(guard.record(2000), false)
  assert.equal(guard.record(3000), true)
})

test('crashloop guard ignores crashes outside the window', () => {
  const guard = createCrashloopGuard({ windowMs: 5000, maxCrashes: 3 })
  assert.equal(guard.record(1000), false)
  assert.equal(guard.record(2000), false)
  assert.equal(guard.record(8000), false)
})

test('roles array is server then ssr and only ssr restarts', () => {
  const roles = buildRoles({ apiMaxOldSpaceSize: 2048, ssrMaxOldSpaceSize: 512 })
  assert.equal(roles[0].name, 'server')
  assert.equal(roles[0].cmd, 'localApiServer')
  assert.equal(roles[0].restart, false)
  assert.equal(roles[0].waitFor, 'dao')
  assert.equal(roles[1].name, 'ssr')
  assert.equal(roles[1].cmd, 'ssrDev')
  assert.equal(roles[1].restart, true)
  assert.equal(roles[1].heapMb, 512)
  assert.equal(roles[0].inspectPort, DEFAULT_API_INSPECT_PORT)
  assert.equal(roles[1].inspectPort, DEFAULT_SSR_INSPECT_PORT)
})

test('waitForDaoWs keeps waiting with progress logs then resolves on connect', async () => {
  const logs = []
  const fakeDao = new EventEmitter()
  fakeDao.dispose = () => { fakeDao.disposed = true }
  const ready = waitForDaoWs({
    url: 'ws://127.0.0.1:9/api/ws',
    log: msg => logs.push(msg),
    progressMs: 40,
    createDao: () => fakeDao
  })
  await sleep(70)
  assert.ok(logs.some(line => /still waiting for API DAO WS/.test(line)))
  fakeDao.emit('connect')
  await ready
  assert.equal(fakeDao.disposed, true)
})

test('waitForDaoWs aborts without a timeout path', async () => {
  const fakeDao = new EventEmitter()
  fakeDao.dispose = () => {}
  const abort = new AbortController()
  const ready = waitForDaoWs({
    url: 'ws://127.0.0.1:9/api/ws',
    log: () => {},
    progressMs: 60_000,
    createDao: () => fakeDao,
    abortSignal: abort.signal
  })
  abort.abort()
  await assert.rejects(ready, /aborted waiting for API DAO WS/)
})

test('API exit sends SIGTERM to SSR and exits 1', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'localDevSplit-'))
  const children = { api: null, ssr: [] }
  let exitCode = null
  const done = runLocalDevSplit({
    apiPort: 8002,
    ssrPort: 8001,
    apiMaxOldSpaceSize: 2048,
    ssrMaxOldSpaceSize: 2048,
    logsRoot: tmp,
    startScript: path.join(tmp, 'start.js')
  }, {
    listenSignals: false,
    shutdownGraceMs: 30,
    waitForReady: async () => {},
    exitProcess: code => { exitCode = code },
    spawn: (_cmd, args) => {
      if(args.includes('localApiServer')) {
        children.api = mockChild(11)
        return children.api
      }
      const child = mockChild(20 + children.ssr.length)
      children.ssr.push(child)
      return child
    }
  })

  await sleep(20)
  assert.ok(children.api)
  assert.equal(children.ssr.length, 1)
  children.api.emit('exit', 1, null)
  await done
  assert.equal(exitCode, 1)
  assert.equal(children.ssr[0].killedWith, 'SIGTERM')
})

test('SSR crashloop after three fast exits aborts the runner', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'localDevSplit-'))
  const children = { api: null, ssr: [] }
  let exitCode = null
  const done = runLocalDevSplit({
    apiPort: 8002,
    ssrPort: 8001,
    logsRoot: tmp,
    startScript: path.join(tmp, 'start.js')
  }, {
    listenSignals: false,
    shutdownGraceMs: 30,
    waitForReady: async () => {},
    sleep: async () => {},
    exitProcess: code => { exitCode = code },
    spawn: (_cmd, args) => {
      if(args.includes('localApiServer')) {
        children.api = mockChild(11)
        return children.api
      }
      const child = mockChild(30 + children.ssr.length)
      children.ssr.push(child)
      setImmediate(() => child.emit('exit', 1, null))
      return child
    }
  })

  await done
  assert.equal(exitCode, 1)
  assert.ok(children.ssr.length >= 3)
  assert.equal(children.api.killedWith, 'SIGTERM')
})

test('pickStringVersion ignores yargs boolean version and empty values', () => {
  assert.equal(pickStringVersion(false, true, '', 12, '0.9.195'), '0.9.195')
  assert.equal(pickStringVersion(false, process.env.MISSING, undefined), undefined)
  assert.equal(pickStringVersion(undefined, 'from-env'), 'from-env')
})

test('spawned children get EVENTLOOP_STALL_DUMP_DIR in the day log folder', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'localDevSplit-'))
  const envs = []
  let exitCode = null
  const children = []
  const done = runLocalDevSplit({
    apiPort: 8002,
    logsRoot: tmp,
    startScript: path.join(tmp, 'start.js')
  }, {
    listenSignals: false,
    shutdownGraceMs: 30,
    runnerStart: new Date(2026, 9, 10, 9, 0, 0),
    waitForReady: async () => {},
    exitProcess: code => { exitCode = code },
    spawn: (_cmd, args, opts) => {
      envs.push(opts.env.EVENTLOOP_STALL_DUMP_DIR)
      const child = mockChild(40 + children.length)
      children.push(child)
      return child
    }
  })

  await sleep(20)
  children[0].emit('exit', 0, null)
  await done
  assert.equal(exitCode, 1)
  assert.ok(envs.length >= 1)
  assert.equal(envs[0], path.join(tmp, '2026-10-10'))
})

test('spawned children share VERSION from argv, not yargs boolean', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'localDevSplit-'))
  const versions = []
  let exitCode = null
  const children = []
  const done = runLocalDevSplit({
    apiPort: 8002,
    logsRoot: tmp,
    startScript: path.join(tmp, 'start.js'),
    version: '0.9.195'
  }, {
    listenSignals: false,
    shutdownGraceMs: 30,
    waitForReady: async () => {},
    exitProcess: code => { exitCode = code },
    spawn: (_cmd, args, opts) => {
      versions.push(opts.env.VERSION)
      const child = mockChild(50 + children.length)
      children.push(child)
      return child
    }
  })

  await sleep(20)
  children[0].emit('exit', 0, null)
  await done
  assert.equal(exitCode, 1)
  assert.ok(versions.length >= 2)
  assert.equal(versions[0], '0.9.195')
  assert.equal(versions[1], '0.9.195')
})

test('yargs boolean version is not forwarded as VERSION', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'localDevSplit-'))
  const versions = []
  let exitCode = null
  const children = []
  const done = runLocalDevSplit({
    apiPort: 8002,
    logsRoot: tmp,
    startScript: path.join(tmp, 'start.js'),
    version: false
  }, {
    listenSignals: false,
    shutdownGraceMs: 30,
    waitForReady: async () => {},
    exitProcess: code => { exitCode = code },
    spawn: (_cmd, args, opts) => {
      versions.push(opts.env.VERSION)
      const child = mockChild(60 + children.length)
      children.push(child)
      return child
    }
  })

  await sleep(20)
  children[0].emit('exit', 0, null)
  await done
  assert.equal(exitCode, 1)
  assert.equal(versions[0], process.env.VERSION)
})

test('API and SSR children get distinct --inspect ports', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'localDevSplit-'))
  const inspect = []
  let exitCode = null
  const children = []
  const done = runLocalDevSplit({
    apiPort: 8002,
    logsRoot: tmp,
    startScript: path.join(tmp, 'start.js'),
    apiInspectPort: 9229,
    ssrInspectPort: 9230
  }, {
    listenSignals: false,
    shutdownGraceMs: 30,
    waitForReady: async () => {},
    exitProcess: code => { exitCode = code },
    spawn: (_cmd, args, opts) => {
      inspect.push({
        cmd: args.includes('localApiServer') ? 'api' : 'ssr',
        flag: args.find(arg => String(arg).startsWith('--inspect=')),
        nodeOptions: opts.env.NODE_OPTIONS
      })
      const child = mockChild(70 + children.length)
      children.push(child)
      return child
    }
  })

  await sleep(20)
  children[0].emit('exit', 0, null)
  await done
  assert.equal(exitCode, 1)
  const api = inspect.find(row => row.cmd === 'api')
  const ssr = inspect.find(row => row.cmd === 'ssr')
  assert.equal(api.flag, '--inspect=127.0.0.1:9229')
  assert.equal(ssr.flag, '--inspect=127.0.0.1:9230')
})
