/**
 * Stress CommandQueue (the live trigger executor queue) against triggers + triggers_new.
 *
 * Writes random slow fake triggers, runs the real CommandQueue, and attaches a second
 * ObservableList observer on the same indexRange path. Periodic snapshots compare:
 *   table (state=new) vs indexCount/indexRange get vs queue observer vs shadow observer.
 *
 * Stall classification:
 *   index_not_updated            — table still has `new`, index is empty
 *   missing_observable_signals   — indexRange get has rows, neither observer list does
 *   queue_observer_missed_signals / shadow_observer_missed_signals
 *   queue_did_not_start_visible_items — observer shows work, handleCommand did not start it
 *   processing_hung              — in-flight handlers never finish
 *
 * Env: DB_BACKEND=lmdb|rocksdb  STRESS_N  STRESS_WRITERS  STRESS_MIN_MS  STRESS_MAX_MS
 *      STRESS_STALL_MS  STRESS_TIMEOUT_MS  STRESS_VERBOSE=1  STRESS_BACKENDS=lmdb,rocksdb
 */

import test from 'tape'
import { rimrafSync } from 'rimraf'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ReactiveDao from '@live-change/dao'
import CommandQueue from '@live-change/framework/lib/utils/CommandQueue.js'
import Server from '../../lib/Server.js'

const here = path.dirname(fileURLToPath(import.meta.url))

const SERVICE = 'stress'
const TABLE = 'triggers'
const INDEX = 'triggers_new'
const TYPES = ['tinyWork', 'slowWork', 'burstWork']

function envInt(name, fallback) {
  const n = Number(process.env[name])
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function envFlag(name) {
  const v = process.env[name]
  return v === '1' || v === 'true'
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function backendsToRun() {
  if (process.env.STRESS_BACKENDS) {
    return process.env.STRESS_BACKENDS.split(',').map(s => s.trim()).filter(Boolean)
  }
  if (process.env.DB_BACKEND) return [process.env.DB_BACKEND]
  return ['lmdb', 'rocksdb']
}

function processDelayMs(type, minMs, maxMs) {
  if (type === 'tinyWork') return randInt(0, Math.min(20, maxMs))
  if (type === 'slowWork') return randInt(minMs, Math.max(minMs, Math.round(maxMs * 0.6)))
  return randInt(Math.max(minMs, Math.round(maxMs * 0.5)), maxMs)
}

function idsOf(list) {
  return (list || []).map(row => row && row.id).filter(Boolean)
}

function truncateIds(ids, n = 8) {
  if (ids.length <= n) return ids.join(',')
  return ids.slice(0, n).join(',') + `…(+${ids.length - n})`
}

class EventLog {
  constructor(source, verbose) {
    this.source = source
    this.verbose = verbose
    this.events = []
    this.maxKeep = 400
    this.counts = Object.create(null)
    this.lastAt = 0
    this.idsSeen = new Set()
  }

  record(signal, details = {}) {
    const at = Date.now()
    this.lastAt = at
    this.counts[signal] = (this.counts[signal] || 0) + 1
    const ids = details.ids || (details.id ? [details.id] : [])
    for (const id of ids) this.idsSeen.add(id)
    const event = { at, source: this.source, signal, ...details, ids }
    this.events.push(event)
    if (this.events.length > this.maxKeep) this.events.splice(0, this.events.length - this.maxKeep)
    if (this.verbose) {
      const extra = details.note || details.error || details.type || ''
      console.log(
        `[${this.source}] ${signal}` +
        (ids.length ? ` ids=${truncateIds(ids)}` : '') +
        (extra ? ` ${extra}` : '')
      )
    }
    return event
  }

  dump(n = 40) {
    const slice = this.events.slice(-n)
    return slice.map(e => {
      const dt = e.at
      return `  ${this.source} ${e.signal} ids=${truncateIds(e.ids || [])}` +
        (e.note ? ` ${e.note}` : '') +
        ` @${dt}`
    }).join('\n')
  }
}

class ShadowObserver {
  constructor(log) {
    this.log = log
    this._resolveReady = null
    this.ready = new Promise(resolve => { this._resolveReady = resolve })
  }

  set(value) {
    const list = Array.isArray(value) ? value : []
    this.log.record('set', { ids: idsOf(list), note: `len=${list.length}` })
    if (this._resolveReady) {
      this._resolveReady()
      this._resolveReady = null
    }
  }

  putByField(field, id, command, reverse, oldObject) {
    this.log.record('putByField', {
      id,
      type: command && command.type,
      note: `reverse=${!!reverse} old=${oldObject ? 'yes' : 'no'} state=${command && command.state}`
    })
  }

  push(command) {
    this.log.record('push', {
      id: command && command.id,
      type: command && command.type,
      note: `state=${command && command.state}`
    })
  }

  removeByField(field, id) {
    this.log.record('removeByField', { id, note: `field=${field}` })
  }

  error(error) {
    this.log.record('error', { error: error && (error.message || String(error)) })
  }
}

function instrumentQueue(queue, log) {
  const orig = {
    set: queue.set,
    putByField: queue.putByField,
    push: queue.push,
    removeByField: queue.removeByField,
    handleCommand: queue.handleCommand
  }

  queue.set = function(value) {
    const list = Array.isArray(value) ? value : []
    log.record('set', { ids: idsOf(list), note: `len=${list.length}` })
    return orig.set.call(this, value)
  }
  queue.putByField = function(field, id, command, reverse, oldObject) {
    log.record('putByField', {
      id,
      type: command && command.type,
      note: `reverse=${!!reverse} old=${oldObject ? 'yes' : 'no'} state=${command && command.state}`
    })
    return orig.putByField.call(this, field, id, command, reverse, oldObject)
  }
  queue.push = function(command) {
    log.record('push', {
      id: command && command.id,
      type: command && command.type,
      note: `state=${command && command.state}`
    })
    return orig.push.call(this, command)
  }
  queue.removeByField = function(field, id, oldObject) {
    log.record('removeByField', { id, note: `field=${field}` })
    return orig.removeByField.call(this, field, id, oldObject)
  }
  queue.handleCommand = function(command) {
    const already = command && this.commandsStarted.has(command.id)
    const skipState = command && command.state !== 'new'
    log.record('handleCommand', {
      id: command && command.id,
      type: command && command.type,
      note: already ? 'skip-started' : (skipState ? `skip-state=${command.state}` : 'start')
    })
    return orig.handleCommand.call(this, command)
  }
}

function classifyStall(snap) {
  if (snap.inFlight > 0) {
    if (snap.msSinceProcess > snap.stallMs) return 'processing_hung'
    return 'processing_in_flight'
  }
  if (snap.tableNew > 0 && snap.indexCount === 0 && snap.indexGet === 0) {
    return 'index_not_updated'
  }
  if (snap.indexGet > 0 && snap.queueObs === 0 && snap.shadowObs === 0) {
    return 'missing_observable_signals'
  }
  if (snap.indexGet > 0 && snap.shadowObs > 0 && snap.queueObs === 0) {
    return 'queue_observer_missed_signals'
  }
  if (snap.indexGet > 0 && snap.queueObs > 0 && snap.shadowObs === 0) {
    return 'shadow_observer_missed_signals'
  }
  if (snap.queueObs > 0 && snap.inFlight === 0) {
    return 'queue_did_not_start_visible_items'
  }
  if (snap.tableNew > 0 && snap.indexCount > 0 && snap.queueObs === 0 && snap.shadowObs === 0) {
    return 'missing_observable_signals'
  }
  return 'unknown_stall'
}

async function snapshot(dao, dbName, queue, shadowObs, stats) {
  const range = {
    gt: SERVICE + '_',
    lt: SERVICE + '_\xFF',
    limit: 128
  }
  let tableRows = []
  let indexRows = []
  let indexCount = 0
  let indexState = null
  try {
    tableRows = await dao.get(['database', 'tableRange', dbName, TABLE, {}]) || []
  } catch (e) {
    tableRows = []
  }
  try {
    indexRows = await dao.get(['database', 'indexRange', dbName, INDEX, range]) || []
  } catch (e) {
    indexRows = []
  }
  try {
    indexCount = await dao.get(['database', 'indexCount', dbName, INDEX, {
      gt: range.gt,
      lt: range.lt
    }])
  } catch (e) {
    indexCount = -1
  }
  try {
    indexState = await dao.get(['database', 'indexState', dbName, INDEX])
  } catch (e) {
    indexState = { error: String(e && e.message || e) }
  }

  const tableNew = tableRows.filter(r => r && r.state === 'new').length
  const queueList = queue.observable ? (queue.observable.getValue() || []) : []
  const shadowList = shadowObs ? (shadowObs.getValue() || []) : []
  const now = Date.now()

  return {
    written: stats.written,
    processed: stats.processed,
    failed: stats.failed,
    remaining: stats.written - stats.processed - stats.failed,
    inFlight: stats.inFlight,
    queueStarted: queue.commandsStarted.size,
    tableNew,
    indexGet: indexRows.length,
    indexCount: typeof indexCount === 'number' ? indexCount : -1,
    queueObs: queueList.length,
    shadowObs: shadowList.length,
    indexState: indexState && indexState.status,
    queueIds: idsOf(queueList),
    shadowIds: idsOf(shadowList),
    getIds: idsOf(indexRows),
    msSinceQueueSignal: stats.queueLog.lastAt ? now - stats.queueLog.lastAt : null,
    msSinceShadowSignal: stats.shadowLog.lastAt ? now - stats.shadowLog.lastAt : null,
    msSinceProcess: stats.lastProcessAt ? now - stats.lastProcessAt : null,
    stallMs: stats.stallMs
  }
}

function logSnap(label, snap) {
  console.log(
    `[snap ${label}] written=${snap.written} processed=${snap.processed} failed=${snap.failed}` +
    ` remaining=${snap.remaining} inFlight=${snap.inFlight} started=${snap.queueStarted}` +
    ` tableNew=${snap.tableNew} indexCount=${snap.indexCount} indexGet=${snap.indexGet}` +
    ` queueObs=${snap.queueObs} shadowObs=${snap.shadowObs}` +
    ` indexState=${snap.indexState}` +
    ` sinceQueue=${snap.msSinceQueueSignal}ms sinceShadow=${snap.msSinceShadowSignal}ms` +
    ` sinceProcess=${snap.msSinceProcess}ms`
  )
  if (snap.getIds.join() !== snap.queueIds.join() || snap.getIds.join() !== snap.shadowIds.join()) {
    console.log(`[snap ${label}] get    ${truncateIds(snap.getIds, 12)}`)
    console.log(`[snap ${label}] queue  ${truncateIds(snap.queueIds, 12)}`)
    console.log(`[snap ${label}] shadow ${truncateIds(snap.shadowIds, 12)}`)
  }
}

async function createTestServer(dbRoot, backend) {
  rimrafSync(dbRoot)
  await fs.promises.mkdir(dbRoot, { recursive: true })
  const server = new Server({
    backend,
    dbRoot,
    opLogClearDisabled: true
  })
  await server.initialize({ skipOpLogCleaner: true })
  return server
}

async function runStress(t, backend) {
  const n = envInt('STRESS_N', 360)
  const writers = envInt('STRESS_WRITERS', 8)
  const minMs = envInt('STRESS_MIN_MS', 30)
  const maxMs = envInt('STRESS_MAX_MS', 220)
  const stallMs = envInt('STRESS_STALL_MS', 5000)
  const timeoutMs = envInt('STRESS_TIMEOUT_MS', 60000)
  const verbose = envFlag('STRESS_VERBOSE')
  const dbRoot = path.join(here, `test-triggers-queue-stall-${backend}.db`)
  const dbName = `triggers.queue.stall.${backend}`

  console.log(
    `[stress] backend=${backend} n=${n} writers=${writers} process=${minMs}-${maxMs}ms` +
    ` stallMs=${stallMs} timeoutMs=${timeoutMs} verbose=${verbose}`
  )

  let server
  try {
    server = await createTestServer(dbRoot, backend)
  } catch (e) {
    t.comment(`backend ${backend} unavailable: ${e && e.message || e}`)
    t.pass(`skip ${backend}`)
    return
  }

  const dao = server.createDao('queue')
  const daoShadow = server.createDao('shadow')
  const daoWriter = server.createDao('writer')

  const queueLog = new EventLog('queue', verbose)
  const shadowLog = new EventLog('shadow', verbose)
  const stats = {
    written: 0,
    processed: 0,
    failed: 0,
    inFlight: 0,
    lastProcessAt: Date.now(),
    queueLog,
    shadowLog,
    stallMs
  }

  const queue = new CommandQueue(dao, dbName, TABLE, SERVICE, {})
  instrumentQueue(queue, queueLog)
  let shadow = null
  let shadowObs = null

  try {
  const handler = async (trig) => {
    const type = trig.type
    const ms = processDelayMs(type, minMs, maxMs)
    stats.inFlight++
    stats.lastProcessAt = Date.now()
    queueLog.record('processStart', { id: trig.id, type, note: `delay=${ms}ms inFlight=${stats.inFlight}` })
    try {
      if (Math.random() < 0.02) {
        throw new Error('fake-trigger-fail')
      }
      await delay(ms)
      stats.processed++
      stats.lastProcessAt = Date.now()
      queueLog.record('processDone', { id: trig.id, type, note: `processed=${stats.processed}` })
      return { ok: true, ms }
    } catch (e) {
      stats.failed++
      stats.lastProcessAt = Date.now()
      queueLog.record('processFail', { id: trig.id, type, note: e.message })
      throw e
    } finally {
      stats.inFlight--
    }
  }

  for (const type of TYPES) {
    queue.addCommandHandler(type, handler)
  }

  await dao.request(['database', 'createDatabase'], dbName)
  let started = false
  await Promise.race([
    queue.start().then(() => { started = true }),
    delay(15000).then(() => {
      if (!started) throw new Error('CommandQueue.start timed out waiting for triggers_new set')
    })
  ])

  shadow = new ShadowObserver(shadowLog)
  shadowObs = daoShadow.observable(queue.queuePath, ReactiveDao.ObservableList)
  shadowObs.observe(shadow)
  await Promise.race([shadow.ready, delay(3000)])

  let seq = 0
  async function writeAll() {
    async function worker() {
      while (true) {
        const i = seq++
        if (i >= n) return
        const type = TYPES[randInt(0, TYPES.length - 1)]
        const id = `${i.toString(16).padStart(6, '0')}${Math.random().toString(16).slice(2, 10)}`
        await daoWriter.request(['database', 'put'], dbName, TABLE, {
          id,
          type,
          service: SERVICE,
          state: 'new',
          timestamp: new Date().toISOString(),
          data: { n: i, noise: Math.random().toString(36).slice(2) }
        })
        stats.written++
      }
    }
    await Promise.all(Array.from({ length: Math.max(1, writers) }, worker))
  }

  const startedAt = Date.now()
  let stall = null
  let lastSnap = null
  let writersDone = false

  const writePromise = writeAll().then(() => {
    writersDone = true
    console.log(`[stress] writers done written=${stats.written} in ${Date.now() - startedAt}ms`)
  })

  const monitor = (async () => {
    while (Date.now() - startedAt < timeoutMs) {
      lastSnap = await snapshot(dao, dbName, queue, shadowObs, stats)
      logSnap(((Date.now() - startedAt) / 1000).toFixed(1) + 's', lastSnap)

      const remaining = lastSnap.remaining
      if (writersDone && remaining <= 0 && lastSnap.inFlight === 0) {
        return
      }

      const noProgress = lastSnap.msSinceProcess != null && lastSnap.msSinceProcess > stallMs
      if (writersDone && remaining > 0 && noProgress) {
        stall = classifyStall(lastSnap)
        return
      }
      await delay(250)
    }
    lastSnap = await snapshot(dao, dbName, queue, shadowObs, stats)
    if (lastSnap.remaining > 0 || lastSnap.inFlight > 0) {
      stall = classifyStall(lastSnap)
    }
  })()

  await monitor
  if (!writersDone) {
    await Promise.race([writePromise, delay(2000)])
  } else {
    await writePromise
  }

  lastSnap = lastSnap || await snapshot(dao, dbName, queue, shadowObs, stats)
  logSnap('final', lastSnap)

  console.log('[stress] queue observer counts', queueLog.counts)
  console.log('[stress] shadow observer counts', shadowLog.counts)
  console.log('[stress] queue ids seen', queueLog.idsSeen.size, 'shadow ids seen', shadowLog.idsSeen.size)

  if (stall) {
    console.log(`[stress] STALL ${stall}`)
    console.log(
      `[stress] refill gap: remaining=${lastSnap.remaining} indexGet=${lastSnap.indexGet}` +
      ` queueObs=${lastSnap.queueObs} shadowObs=${lastSnap.shadowObs}` +
      ` queue.put=${queueLog.counts.putByField || 0} queue.push=${queueLog.counts.push || 0}` +
      ` queue.remove=${queueLog.counts.removeByField || 0}` +
      ` shadow.put=${shadowLog.counts.putByField || 0} shadow.push=${shadowLog.counts.push || 0}` +
      ` shadow.remove=${shadowLog.counts.removeByField || 0}`
    )
    console.log('[stress] last queue events:\n' + queueLog.dump())
    console.log('[stress] last shadow events:\n' + shadowLog.dump())
  }

  t.ok(queueLog.counts.set || queueLog.counts.putByField || queueLog.counts.push,
    'queue observer received at least one list signal')
  t.ok(shadowLog.counts.set || shadowLog.counts.putByField || shadowLog.counts.push,
    'shadow observer received at least one list signal')
  t.ok(lastSnap.queueObs <= 128, `queue observer within limit (${lastSnap.queueObs}<=128)`)
  t.ok(lastSnap.shadowObs <= 128, `shadow observer within limit (${lastSnap.shadowObs}<=128)`)
  t.deepEqual(lastSnap.queueIds, lastSnap.getIds, 'queue observer matches indexRange get')
  t.equal(
    stall,
    null,
    stall
      ? `queue stalled (${stall}) remaining=${lastSnap.remaining} tableNew=${lastSnap.tableNew}` +
        ` indexCount=${lastSnap.indexCount} indexGet=${lastSnap.indexGet}` +
        ` queueObs=${lastSnap.queueObs} shadowObs=${lastSnap.shadowObs}` +
        ` inFlight=${lastSnap.inFlight} indexState=${lastSnap.indexState}`
      : 'no stall'
  )
  t.equal(lastSnap.processed + lastSnap.failed, lastSnap.written,
    `processed+failed (${lastSnap.processed}+${lastSnap.failed}) == written (${lastSnap.written})`)
  } finally {
    await queue.dispose().catch(() => {})
    if (shadowObs && shadow) {
      try { shadowObs.unobserve(shadow) } catch (e) {}
    }
    if (server) await server.close().catch(() => {})
    await delay(250)
    try { rimrafSync(dbRoot) } catch (e) {}
  }
}

const backends = backendsToRun()

for (const backend of backends) {
  test(`CommandQueue triggers_new stall stress (${backend})`, async t => {
    await runStress(t, backend)
  })
}
