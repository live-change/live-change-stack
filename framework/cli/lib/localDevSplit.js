import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'

export const DEFAULT_API_MAX_OLD_SPACE_SIZE = 2048
export const DEFAULT_SSR_MAX_OLD_SPACE_SIZE = 2048
export const DEFAULT_API_INSPECT_PORT = 9229
export const DEFAULT_SSR_INSPECT_PORT = 9230
export const DEFAULT_INSPECT_HOST = '127.0.0.1'
export const SSR_BACKOFF_SECONDS = [1, 2, 5, 10, 30]
export const SSR_ALIVE_RESET_MS = 60_000
export const CRASHLOOP_WINDOW_MS = 5_000
export const CRASHLOOP_MAX = 3
export const SHUTDOWN_GRACE_MS = 10_000
export const DAO_PROGRESS_MS = 10_000

const YARGS_INTERNAL = new Set(['$0', '_', '--', 'help', 'version', 'verbose'])
const RUNNER_ONLY_KEYS = new Set([
  'apiMaxOldSpaceSize',
  'ssrMaxOldSpaceSize',
  'apiInspectPort',
  'ssrInspectPort',
  'inspectHost',
  'exposeGc',
  'servicesConfig',
  'startScript',
  'logsRoot',
  'uidBorders'
])
const SSR_SKIP_KEYS = new Set([
  ...RUNNER_ONLY_KEYS,
  'withApi',
  'dbAccess',
  'dbBackend',
  'dbBackendUrl',
  'dbRoot',
  'withDb',
  'createDb',
  'withServices',
  'updateServices',
  'initScript',
  'stopped'
])
const API_SKIP_KEYS = new Set([
  ...RUNNER_ONLY_KEYS,
  'withApi',
  'ssrPort',
  'ssrHost',
  'ssrRoot',
  'serverEntry',
  'templatePath',
  'plugin',
  'mode',
  'spa',
  'sessionCookieExpire',
  'sessionCookieDomain',
  'contextPoolSize',
  'maxQueueSize',
  'renderTimeout',
  'contextMaxUses'
])

export function resolveInspectPort(value, defaultPort) {
  if(value === undefined || value === null || value === '') return defaultPort
  if(value === false || value === 'false') return null
  const port = Number(value)
  if(!Number.isFinite(port) || port <= 0) return null
  return port
}

export function inspectAddress(host, port) {
  if(!port) return null
  return `${host || DEFAULT_INSPECT_HOST}:${port}`
}

export function stripInspectFromNodeOptions(nodeOptions) {
  if(!nodeOptions) return nodeOptions
  const cleaned = String(nodeOptions)
    .replace(/(?:^|\s)--inspect(?:-brk|-port)?(?:=\S+)?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || undefined
}

export function pickStringVersion(...candidates) {
  for(const value of candidates) {
    if(typeof value === 'string' && value) return value
  }
}

export function addLocalDevSplitCommandOptions(yargs) {
  return yargs
    .option('apiMaxOldSpaceSize', {
      describe: 'API node --max-old-space-size in MB',
      type: 'number',
      default: DEFAULT_API_MAX_OLD_SPACE_SIZE
    })
    .option('ssrMaxOldSpaceSize', {
      describe: 'SSR node --max-old-space-size in MB',
      type: 'number',
      default: DEFAULT_SSR_MAX_OLD_SPACE_SIZE
    })
    .option('apiInspectPort', {
      describe: 'API --inspect port (0 disables CDP)',
      type: 'number',
      default: DEFAULT_API_INSPECT_PORT
    })
    .option('ssrInspectPort', {
      describe: 'SSR --inspect port (0 disables CDP)',
      type: 'number',
      default: DEFAULT_SSR_INSPECT_PORT
    })
    .option('inspectHost', {
      describe: 'bind host for child --inspect',
      type: 'string',
      default: DEFAULT_INSPECT_HOST
    })
}

export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function formatDay(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function formatStamp(date) {
  return `${formatDay(date)}T${pad2(date.getHours())}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}`
}

export function buildLogPaths({ logsRoot, runnerStart, serverStart, ssrStart }) {
  const dayDir = path.join(logsRoot, formatDay(runnerStart))
  const paths = {
    dayDir,
    runnerLog: path.join(dayDir, `${formatStamp(runnerStart)}-runner.log`)
  }
  if(serverStart) {
    paths.serverLog = path.join(dayDir, `${formatStamp(serverStart)}-server.log`)
  }
  if(ssrStart) {
    paths.ssrLog = path.join(dayDir, `${formatStamp(ssrStart)}-ssr.log`)
  }
  return paths
}

export function nextBackoffMs(attempt) {
  const seconds = SSR_BACKOFF_SECONDS[Math.min(attempt, SSR_BACKOFF_SECONDS.length - 1)]
  return seconds * 1000
}

export function createCrashloopGuard({
  windowMs = CRASHLOOP_WINDOW_MS,
  maxCrashes = CRASHLOOP_MAX
} = {}) {
  const times = []
  return {
    record(now = Date.now()) {
      times.push(now)
      while(times.length && now - times[0] > windowMs) times.shift()
      return times.length >= maxCrashes
    },
    count() {
      return times.length
    }
  }
}

export function buildRoles(argv = {}) {
  return [
    {
      name: 'server',
      cmd: 'localApiServer',
      heapMb: argv.apiMaxOldSpaceSize ?? DEFAULT_API_MAX_OLD_SPACE_SIZE,
      inspectPort: resolveInspectPort(argv.apiInspectPort, DEFAULT_API_INSPECT_PORT),
      restart: false,
      waitFor: 'dao'
    },
    {
      name: 'ssr',
      cmd: 'ssrDev',
      heapMb: argv.ssrMaxOldSpaceSize ?? DEFAULT_SSR_MAX_OLD_SPACE_SIZE,
      inspectPort: resolveInspectPort(argv.ssrInspectPort, DEFAULT_SSR_INSPECT_PORT),
      restart: true,
      waitFor: null
    }
  ]
}

function isForwardableKey(key) {
  if(YARGS_INTERNAL.has(key)) return false
  if(key.startsWith('$')) return false
  if(key.includes('-')) return false
  return /^[A-Za-z]/.test(key)
}

function isForwardableValue(value) {
  const t = typeof value
  return t === 'string' || t === 'number' || t === 'boolean'
}

export function argvToCliFlags(argv, { skip = new Set() } = {}) {
  const flags = []
  for(const key of Object.keys(argv || {})) {
    if(!isForwardableKey(key)) continue
    if(skip.has(key)) continue
    const value = argv[key]
    if(!isForwardableValue(value)) continue
    if(value === false) continue
    if(value === true) {
      flags.push(`--${key}`)
      continue
    }
    flags.push(`--${key}`, String(value))
  }
  return flags
}

export function buildApiFlags(argv) {
  return argvToCliFlags(argv, { skip: API_SKIP_KEYS })
}

export function buildSsrFlags(argv) {
  const flags = argvToCliFlags(argv, { skip: SSR_SKIP_KEYS })
  if(!flags.includes('--withApi')) return flags
  return flags.filter((flag, i) => flag !== '--withApi' && flags[i - 1] !== '--withApi')
}

export function buildChildNodeArgs({
  heapMb,
  startScript,
  cmd,
  flags = [],
  inspectPort,
  inspectHost = DEFAULT_INSPECT_HOST,
  exposeGc = true
}) {
  const nodeArgs = [`--max-old-space-size=${heapMb}`]
  const address = inspectAddress(inspectHost, inspectPort)
  if(address) {
    nodeArgs.push(`--inspect=${address}`)
    if(exposeGc !== false) nodeArgs.push('--expose-gc')
  }
  nodeArgs.push('--import', 'tsx', startScript, cmd, ...flags)
  return nodeArgs
}

export function daoWsUrl(argv) {
  const port = argv.apiPort || 8002
  const host = (!argv.apiHost || argv.apiHost === '0.0.0.0') ? '127.0.0.1' : argv.apiHost
  return `ws://${host}:${port}/api/ws`
}

export async function defaultCreateDao(url) {
  const { serverDao } = await import('@live-change/server')
  const dao = serverDao({ sessionKey: 'localDevSplit-ready' }, '127.0.0.1', {
    remoteUrl: url,
    connectionSettings: {
      autoReconnectDelay: 500,
      logLevel: 0
    }
  })
  dao.connect({ protocol: 'ws', url })
  return dao
}

export async function waitForDaoWs({
  url,
  log = () => {},
  abortSignal,
  progressMs = DAO_PROGRESS_MS,
  createDao = defaultCreateDao
} = {}) {
  const started = Date.now()
  const progress = setInterval(() => {
    const elapsed = Math.round((Date.now() - started) / 1000)
    log(`still waiting for API DAO WS (${elapsed}s elapsed)`)
  }, progressMs)

  let dao
  try {
    dao = await Promise.resolve(createDao(url))
  } catch(err) {
    clearInterval(progress)
    throw err
  }

  return new Promise((resolve, reject) => {
    let settled = false
    function finish(err) {
      if(settled) return
      settled = true
      clearInterval(progress)
      abortSignal?.removeEventListener('abort', onAbort)
      try {
        dao.dispose?.()
      } catch {
        // ignore dispose errors after connect
      }
      if(err) reject(err)
      else resolve()
    }

    function onAbort() {
      finish(new Error('aborted waiting for API DAO WS'))
    }

    if(typeof dao.on === 'function') {
      dao.on('connect', () => finish())
    }
    if(abortSignal) {
      if(abortSignal.aborted) {
        onAbort()
        return
      }
      abortSignal.addEventListener('abort', onAbort)
    }
  })
}

function defaultSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function writeStream(stream, data) {
  if(!stream || stream.destroyed || stream.writableEnded || stream.writable === false) return
  try {
    stream.write(data)
  } catch {
    // child logs can arrive after shutdown closed the file
  }
}

function defaultLogLine(msg, { stream, alsoConsole }) {
  const line = `${new Date().toISOString()} ${msg}\n`
  writeStream(stream, line)
  if(alsoConsole) process.stdout.write(line)
}

function childAlive(child) {
  return child && child.exitCode == null && child.signalCode == null
}

function killChild(child, signal) {
  if(!childAlive(child)) return false
  try {
    child.kill(signal)
    return true
  } catch {
    return false
  }
}

function attachChildLogs(child, stream, onChunk) {
  const write = chunk => {
    writeStream(stream, chunk)
    onChunk?.(chunk)
  }
  child.stdout?.on('data', write)
  child.stderr?.on('data', write)
}

export async function runLocalDevSplit(argv = {}, deps = {}) {
  const spawnFn = deps.spawn || spawn
  const waitForReady = deps.waitForReady || waitForDaoWs
  const exitProcess = deps.exitProcess || (code => process.exit(code))
  const sleep = deps.sleep || defaultSleep
  const createDao = deps.createDao || defaultCreateDao
  const listenSignals = deps.listenSignals !== false
  const shutdownGraceMs = deps.shutdownGraceMs ?? SHUTDOWN_GRACE_MS
  const now = deps.now || Date.now
  const mkdirSync = deps.mkdirSync || ((dir, opts) => fs.mkdirSync(dir, opts))
  const createWriteStream = deps.createWriteStream || (file => fs.createWriteStream(file, { flags: 'a' }))

  const startScript = argv.startScript || path.resolve(process.argv[1])
  const logsRoot = argv.logsRoot || path.join(process.cwd(), 'logs')
  const runnerStart = deps.runnerStart || new Date(now())
  const apiPort = argv.apiPort || 8002
  const ssrPort = argv.ssrPort || 8001
  const roles = argv.roles || buildRoles(argv)
  const appVersion = pickStringVersion(argv.version, process.env.VERSION)

  const paths = buildLogPaths({ logsRoot, runnerStart, serverStart: runnerStart })
  mkdirSync(paths.dayDir, { recursive: true })

  const runnerStream = createWriteStream(paths.runnerLog)
  const log = msg => defaultLogLine(msg, { stream: runnerStream, alsoConsole: true })

  const abort = new AbortController()
  const crashloop = createCrashloopGuard()
  let stopping = false
  let exitCode = 0
  let apiChild = null
  let ssrChild = null
  let ssrLogStream = null
  let ssrStartedAt = 0
  let ssrCrashAttempt = 0
  let shutdownPromise = null
  let resolveDone
  const done = new Promise(resolve => { resolveDone = resolve })

  function ssrPublicUrl() {
    return `http://127.0.0.1:${ssrPort}/`
  }

  async function waitDead(child, graceMs) {
    if(!childAlive(child)) return
    await Promise.race([
      once(child, 'exit').catch(() => {}),
      sleep(graceMs)
    ])
    if(childAlive(child)) killChild(child, 'SIGKILL')
  }

  async function shutdown(code) {
    if(shutdownPromise) return shutdownPromise
    stopping = true
    exitCode = code
    abort.abort()
    shutdownPromise = (async () => {
      log(`shutting down (exit ${code})`)
      killChild(ssrChild, 'SIGTERM')
      killChild(apiChild, 'SIGTERM')
      await waitDead(ssrChild, shutdownGraceMs)
      await waitDead(apiChild, shutdownGraceMs)
      try { ssrLogStream?.end() } catch { /* ignore */ }
      try { runnerStream.end() } catch { /* ignore */ }
      exitProcess(code)
      resolveDone(code)
    })()
    return shutdownPromise
  }

  function spawnRole(role, flags, logFile, extraEnv = {}) {
    const inspectHost = argv.inspectHost || DEFAULT_INSPECT_HOST
    const args = buildChildNodeArgs({
      heapMb: role.heapMb,
      startScript,
      cmd: role.cmd,
      flags,
      inspectPort: role.inspectPort,
      inspectHost
    })
    const stream = createWriteStream(logFile)
    const cdp = inspectAddress(inspectHost, role.inspectPort)
    log(`starting ${role.name} command=${role.cmd} heap=${role.heapMb}MB log=${logFile}`)
    if(cdp) log(`${role.name} CDP chrome://inspect  --inspect=${cdp}`)
    const childEnv = {
      ...process.env,
      EVENTLOOP_STALL_DUMP_DIR: paths.dayDir,
      ...(appVersion ? { VERSION: appVersion } : {}),
      ...extraEnv
    }
    const cleanedNodeOptions = stripInspectFromNodeOptions(childEnv.NODE_OPTIONS)
    if(cleanedNodeOptions) childEnv.NODE_OPTIONS = cleanedNodeOptions
    else delete childEnv.NODE_OPTIONS
    const child = spawnFn(process.execPath, args, {
      cwd: process.cwd(),
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      shell: false
    })
    attachChildLogs(child, stream, chunk => {
      if(role.name !== 'ssr') return
      const text = chunk.toString()
      if(text.includes('LISTENING ON') || text.includes('link: http://')) {
        log(`SSR is listening at ${ssrPublicUrl()}`)
      }
    })
    child.on('error', err => {
      log(`${role.name} spawn error: ${err.message}`)
    })
    return { child, stream }
  }

  async function startSsr() {
    if(stopping) return
    const ssrStart = new Date(now())
    const ssrPaths = buildLogPaths({ logsRoot, runnerStart, ssrStart })
    const role = roles.find(r => r.name === 'ssr')
    const spawned = spawnRole(role, buildSsrFlags(argv), ssrPaths.ssrLog)
    ssrChild = spawned.child
    ssrLogStream = spawned.stream
    ssrStartedAt = now()
    log(`started ssr pid=${ssrChild.pid} log=${ssrPaths.ssrLog}`)

    ssrChild.on('exit', (code, signal) => {
      const how = signal ? `signal=${signal}` : `code=${code}`
      log(`ssr exited ${how}`)
      try { ssrLogStream?.end() } catch { /* ignore */ }
      if(stopping) return
      const aliveFor = now() - ssrStartedAt
      if(aliveFor >= SSR_ALIVE_RESET_MS) ssrCrashAttempt = 0
      if(crashloop.record(now())) {
        log(`ssr crashloop: ${CRASHLOOP_MAX} exits within ${CRASHLOOP_WINDOW_MS}ms, aborting`)
        shutdown(1)
        return
      }
      const delay = nextBackoffMs(ssrCrashAttempt)
      ssrCrashAttempt += 1
      log(`restarting ssr in ${delay}ms`)
      sleep(delay).then(() => {
        if(stopping) return
        return startSsr()
      }).catch(err => {
        log(`ssr restart error: ${err.message}`)
      })
    })
  }

  if(listenSignals) {
    const onSignal = sig => {
      log(`received ${sig}`)
      shutdown(0)
    }
    process.on('SIGINT', onSignal)
    process.on('SIGTERM', onSignal)
  }

  const apiRole = roles.find(r => r.name === 'server')
  const serverStart = new Date(now())
  const serverPaths = buildLogPaths({ logsRoot, runnerStart, serverStart })
  if(appVersion) log(`shared VERSION=${appVersion}`)
  const apiSpawned = spawnRole(apiRole, buildApiFlags(argv), serverPaths.serverLog)
  apiChild = apiSpawned.child
  log(`started server pid=${apiChild.pid} log=${serverPaths.serverLog}`)

  apiChild.on('exit', (code, signal) => {
    const how = signal ? `signal=${signal}` : `code=${code}`
    log(`server exited ${how}`)
    if(stopping) return
    shutdown(1)
  })

  try {
    log(`waiting for API DAO WS at ${daoWsUrl(argv)} (no timeout)`)
    await waitForReady({
      url: daoWsUrl(argv),
      log,
      abortSignal: abort.signal,
      createDao
    })
    if(stopping) return await done
    log('API DAO WS is ready')
    await startSsr()
  } catch(err) {
    if(!stopping) {
      log(`failed waiting for API DAO WS: ${err.message}`)
      await shutdown(1)
    }
  }

  return await done
}
