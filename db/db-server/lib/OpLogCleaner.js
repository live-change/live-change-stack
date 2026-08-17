import Debug from 'debug'
import ReactiveDao from '@live-change/dao'
import {
  createOpLogWritter,
  writeClearOpLogMarker,
  padTimestamp
} from '@live-change/db/lib/clearOpLog.js'
import {
  DEFAULT_OP_LOG_RETENTION_MS,
  resolveOpLogRetentionMs
} from './opLogRetention.js'

const debug = Debug('db-server:oplog-cleaner')

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000
const DEFAULT_BATCH_SIZE = 500
const DEFAULT_MAX_BATCHES_PER_DB = 100000
const DEFAULT_DELAY_MS = 0
const STARTUP_DELAY_MS = 500
const PROGRESS_LOG_EVERY_MS = 2000
const RECENT_RATE_WINDOW_MS = 30000

function idleStatus(extra = {}) {
  return {
    running: false,
    mode: null,
    dbName: null,
    databasesTotal: 0,
    databasesDone: 0,
    batch: 0,
    deleted: 0,
    lastDeleted: 0,
    estimatedTotal: null,
    estimatedDeletable: null,
    progressPercent: null,
    ratePerSec: null,
    etaMs: null,
    startedAt: null,
    finishedAt: null,
    lastError: null,
    message: 'idle',
    ...extra
  }
}

function formatDuration(ms) {
  if(ms == null || !Number.isFinite(ms) || ms < 0) return '?'
  const sec = Math.round(ms / 1000)
  if(sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  const rem = sec % 60
  if(min < 60) return `${min}m ${rem}s`
  const hours = Math.floor(min / 60)
  return `${hours}h ${min % 60}m`
}

function formatCount(n) {
  if(n == null || !Number.isFinite(n)) return '?'
  return String(Math.round(n))
}

function timestampFromOp(op) {
  if(!op) return null
  if(typeof op.timestamp === 'number' && Number.isFinite(op.timestamp)) return op.timestamp
  if(typeof op.id === 'string' && op.id.length >= 16) {
    const ts = Number(op.id.slice(0, 16))
    if(Number.isFinite(ts)) return ts
  }
  return null
}

class OpLogCleaner {
  constructor(server, options = {}) {
    this.server = server
    this.defaultRetentionMs = options.defaultRetentionMs ?? DEFAULT_OP_LOG_RETENTION_MS
    this.intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE
    this.maxBatchesPerDb = options.maxBatchesPerDb ?? DEFAULT_MAX_BATCHES_PER_DB
    this.delayMs = options.delayMs ?? DEFAULT_DELAY_MS
    this.disabled = options.disabled === true
    this.timer = null
    this.startupTimer = null
    this.running = false
    // Keep status on the instance — ObservableValue.dispose() clears .value when
    // UI unsubscribes, which previously crashed getStatus().batch.
    this.status = idleStatus()
    this.statusObservable = new ReactiveDao.ObservableValue({ ...this.status })
    this.statusObservable.observe(() => {}) // prevent dispose / value wipe
  }

  getStatus() {
    return this.status
  }

  setStatus(patch) {
    this.status = {
      ...this.status,
      ...patch
    }
    if(this.statusObservable.isDisposed()) {
      this.statusObservable.respawn()
    }
    this.statusObservable.set({ ...this.status })
  }

  start() {
    if(this.disabled) {
      debug('oplog cleaner disabled')
      this.setStatus({ message: 'auto disabled' })
      return
    }
    if(this.server.config.master) {
      debug('oplog cleaner skipped on replica')
      this.setStatus({ message: 'skipped on replica' })
      return
    }
    if(this.timer) return
    this.timer = setInterval(() => {
      this.tick('auto').catch(err => {
        console.error('OpLogCleaner tick failed', err)
        this.setStatus({ lastError: err.message || String(err), message: 'auto tick failed' })
      })
    }, this.intervalMs)
    if(typeof this.timer.unref === 'function') this.timer.unref()

    this.startupTimer = setTimeout(() => {
      this.startupTimer = null
      console.info('[OpLogCleaner] startup clean begin')
      this.tick('startup').catch(err => {
        console.error('OpLogCleaner startup clean failed', err)
        this.setStatus({ lastError: err.message || String(err), message: 'startup failed' })
      })
    }, STARTUP_DELAY_MS)
    if(typeof this.startupTimer.unref === 'function') this.startupTimer.unref()
    this.setStatus({ message: 'startup scheduled' })
  }

  stop() {
    if(this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if(this.startupTimer) {
      clearTimeout(this.startupTimer)
      this.startupTimer = null
    }
  }

  estimateOpLogEntries(db) {
    try {
      const stats = db.storageStats()
      let total = 0
      for(const store of stats.stores || []) {
        const count = store?.opLog?.entryCount
        if(typeof count === 'number' && count > 0) total += count
      }
      return total
    } catch(err) {
      debug('estimateOpLogEntries failed', err)
      return null
    }
  }

  async estimateStoreDeletable(opLog, cutoff) {
    if(!opLog) return 0
    const deleteBeforeStr = padTimestamp(cutoff)
    let entryCount = null
    if(typeof opLog.stat === 'function') {
      try {
        const stat = opLog.stat()
        if(stat?.available && typeof stat.entryCount === 'number') {
          entryCount = stat.entryCount
        }
      } catch(e) {
        // ignore
      }
    }
    const first = (await opLog.rangeGet({ gt: '', limit: 1 }))[0]
    if(!first) return 0
    if(first.id >= deleteBeforeStr) return 0
    if(entryCount == null) {
      // unknown size but something is older than cutoff
      return null
    }
    if(entryCount <= 0) return 0
    const last = (await opLog.rangeGet({ reverse: true, limit: 1 }))[0]
    const firstTs = timestampFromOp(first)
    const lastTs = timestampFromOp(last)
    if(firstTs == null) return entryCount
    if(lastTs == null || lastTs < cutoff) return entryCount
    const span = lastTs - firstTs
    if(span <= 0) return entryCount
    const frac = Math.min(1, Math.max(0, (cutoff - firstTs) / span))
    return Math.round(entryCount * frac)
  }

  async estimateDeletableOpLogEntries(db, cutoff) {
    let total = 0
    let unknown = false
    for(const name in db.config.tables) {
      const table = db.table(name)
      const part = await this.estimateStoreDeletable(table.opLog, cutoff)
      if(part == null) unknown = true
      else total += part
    }
    for(const name in db.config.indexes) {
      try {
        const config = db.config.indexes[name]
        const index = db.indexes.get(name)
        const opLog = index
          ? index.opLog
          : db.store(config.uid + '.opLog', { ...config, ...config.opLog })
        const part = await this.estimateStoreDeletable(opLog, cutoff)
        if(part == null) unknown = true
        else total += part
      } catch(err) {
        debug('estimate index opLog failed', name, err)
      }
    }
    if(unknown && total === 0) return null
    return total
  }

  computeProgress({
    deleted,
    estimatedDeletable,
    startedAt,
    recentDeleted,
    recentWindowMs,
    stillFullBatches
  }) {
    const elapsedMs = Math.max(1, Date.now() - startedAt)
    const overallRate = deleted / (elapsedMs / 1000)
    const recentRate = recentWindowMs > 1000
      ? recentDeleted / (recentWindowMs / 1000)
      : overallRate
    const ratePerSec = recentRate > 0 ? recentRate : overallRate

    let target = estimatedDeletable
    if(target != null && deleted > target) {
      // estimate was low — grow to deleted + a small lookahead while still busy
      target = stillFullBatches ? deleted + Math.max(recentDeleted, 1) : deleted
    }

    let progressPercent = null
    let etaMs = null
    let remaining = null
    if(target != null && target > 0) {
      remaining = Math.max(0, target - deleted)
      progressPercent = stillFullBatches
        ? Math.min(99, Math.round((deleted / target) * 100))
        : 100
      if(stillFullBatches && ratePerSec > 0) {
        etaMs = Math.round((remaining / ratePerSec) * 1000)
      } else {
        etaMs = 0
      }
    }
    return {
      progressPercent,
      ratePerSec,
      etaMs,
      elapsedMs,
      estimatedDeletable: target,
      remaining
    }
  }

  logProgress(prefix, status) {
    const pct = status.progressPercent != null ? `${status.progressPercent}%` : '?%'
    const eta = formatDuration(status.etaMs)
    const rate = status.ratePerSec != null
      ? `${formatCount(status.ratePerSec)}/s`
      : '?/s'
    const denom = status.estimatedDeletable != null
      ? status.estimatedDeletable
      : status.estimatedTotal
    console.info(
      `[OpLogCleaner] ${prefix}`
      + ` db=${status.dbName || '-'}`
      + ` ${pct}`
      + ` deleted=${formatCount(status.deleted)}`
      + (denom != null ? `/~${formatCount(denom)} deletable` : '')
      + ` batch=${status.batch || 0}`
      + ` rate=${rate}`
      + ` eta=${eta}`
      + ` dbs=${status.databasesDone || 0}/${status.databasesTotal || 0}`
    )
  }

  async tick(mode = 'auto') {
    if(this.disabled || this.server.config.master) return
    if(this.running) {
      debug('tick skipped, already running', mode)
      return
    }
    this.running = true
    const startedAt = Date.now()
    const dbNames = [...this.server.databases.keys()]
    this.setStatus({
      running: true,
      mode,
      dbName: null,
      databasesTotal: dbNames.length,
      databasesDone: 0,
      batch: 0,
      deleted: 0,
      lastDeleted: 0,
      estimatedTotal: null,
      estimatedDeletable: null,
      progressPercent: null,
      ratePerSec: null,
      etaMs: null,
      startedAt,
      finishedAt: null,
      lastError: null,
      message: `${mode} cleaning`
    })
    console.info(`[OpLogCleaner] ${mode} start databases=${dbNames.length}`
      + ` batchSize=${this.batchSize} delayMs=${this.delayMs}`)
    try {
      let done = 0
      for(const dbName of dbNames) {
        await this.cleanDatabase(dbName, {
          batchSize: this.batchSize,
          maxBatches: this.maxBatchesPerDb,
          delayMs: this.delayMs,
          mode
        })
        done++
        this.setStatus({ databasesDone: done })
      }
      const elapsed = Date.now() - startedAt
      this.setStatus({
        running: false,
        mode,
        dbName: null,
        progressPercent: 100,
        etaMs: 0,
        finishedAt: Date.now(),
        message: `${mode} idle`
      })
      console.info(
        `[OpLogCleaner] ${mode} done`
        + ` deleted=${formatCount(this.status.deleted)}`
        + ` in ${formatDuration(elapsed)}`
      )
    } catch(err) {
      this.setStatus({
        running: false,
        finishedAt: Date.now(),
        lastError: err.message || String(err),
        message: `${mode} failed`
      })
      throw err
    } finally {
      this.running = false
    }
  }

  /**
   * Manual cleanup for one database (or all). Fire-and-forget friendly:
   * returns immediately after starting; progress is on statusObservable.
   */
  async runNow(dbName = null, options = {}) {
    if(this.server.config.master) {
      throw new Error('opLogCleanerUnavailableOnReplica')
    }
    if(this.running) {
      throw new Error('opLogCleanerAlreadyRunning')
    }
    const names = dbName ? [dbName] : [...this.server.databases.keys()]
    if(dbName && !this.server.databases.has(dbName)) {
      throw new Error('databaseNotFound')
    }
    const batchSize = options.batchSize ?? this.batchSize
    const maxBatches = options.maxBatches ?? this.maxBatchesPerDb
    const delayMs = options.delayMs ?? 0
    const force = options.force === true
    const mode = 'manual'

    this.running = true
    const startedAt = Date.now()
    this.setStatus({
      running: true,
      mode,
      dbName: dbName || null,
      databasesTotal: names.length,
      databasesDone: 0,
      batch: 0,
      deleted: 0,
      lastDeleted: 0,
      estimatedTotal: null,
      estimatedDeletable: null,
      progressPercent: null,
      ratePerSec: null,
      etaMs: null,
      startedAt,
      finishedAt: null,
      lastError: null,
      message: dbName ? `manual cleaning ${dbName}` : 'manual cleaning all'
    })
    console.info('[OpLogCleaner] manual start', { dbName, names: names.length, batchSize, maxBatches, delayMs })

    const work = (async () => {
      try {
        let done = 0
        for(const name of names) {
          await this.cleanDatabase(name, { batchSize, maxBatches, delayMs, force, mode })
          done++
          this.setStatus({ databasesDone: done })
        }
        const elapsed = Date.now() - startedAt
        this.setStatus({
          running: false,
          mode,
          dbName: null,
          progressPercent: 100,
          etaMs: 0,
          finishedAt: Date.now(),
          message: 'manual done'
        })
        console.info(
          `[OpLogCleaner] manual done`
          + ` deleted=${formatCount(this.status.deleted)}`
          + ` in ${formatDuration(elapsed)}`
        )
        return this.getStatus()
      } catch(err) {
        this.setStatus({
          running: false,
          finishedAt: Date.now(),
          lastError: err.message || String(err),
          message: 'manual failed'
        })
        console.error('[OpLogCleaner] manual failed', err)
        throw err
      } finally {
        this.running = false
      }
    })()

    work.catch(() => {})
    return { started: true, status: this.getStatus(), done: work }
  }

  async cleanDatabase(dbName, options = {}) {
    const db = this.server.databases.get(dbName)
    if(!db) return { skipped: true, reason: 'missing' }
    const meta = this.server.metadata?.databases?.[dbName] || db.config
    let retention = resolveOpLogRetentionMs(meta, this.defaultRetentionMs)
    if(retention === false) {
      if(options.force) {
        retention = this.defaultRetentionMs
      } else {
        debug('skip', dbName, 'retention disabled')
        this.setStatus({
          dbName,
          message: `skip ${dbName} (retention disabled)`
        })
        return { skipped: true, reason: 'retentionDisabled' }
      }
    }
    const cutoff = Date.now() - retention
    const batchSize = options.batchSize ?? this.batchSize
    const maxBatches = options.maxBatches ?? this.maxBatchesPerDb
    const delayMs = options.delayMs ?? this.delayMs
    const mode = options.mode || this.status.mode || 'auto'
    const runStartedAt = this.status.startedAt || Date.now()
    const estimatedTotal = this.estimateOpLogEntries(db)
    const estimatedDeletableDb = await this.estimateDeletableOpLogEntries(db, cutoff)
    const deletedBeforeDb = this.status.deleted || 0
    let estimatedDeletable = estimatedDeletableDb == null
      ? this.status.estimatedDeletable
      : (this.status.estimatedDeletable || 0) + estimatedDeletableDb
    debug('clean', dbName, 'retention', retention, 'cutoff', cutoff,
      'estimatedTotal', estimatedTotal, 'estimatedDeletable', estimatedDeletableDb)

    this.setStatus({
      dbName,
      estimatedTotal: estimatedTotal != null
        ? (this.status.estimatedTotal || 0) + estimatedTotal
        : this.status.estimatedTotal,
      estimatedDeletable,
      message: `cleaning ${dbName}`
    })
    console.info(
      `[OpLogCleaner] ${mode} db=${dbName}`
      + ` opLogEntries=~${formatCount(estimatedTotal)}`
      + ` deletable=~${formatCount(estimatedDeletableDb)}`
      + ` retentionMs=${retention}`
    )

    if(mode === 'startup') {
      return this.cleanDatabaseStartup(db, dbName, {
        cutoff,
        batchSize,
        maxBatches,
        delayMs,
        mode,
        runStartedAt,
        deletedBeforeDb,
        estimatedDeletable
      })
    }

    let batches = 0
    let deleted = deletedBeforeDb
    let lastLogAt = 0
    const recentSamples = [] // { t, deleted }
    recentSamples.push({ t: Date.now(), deleted })
    const clearOptions = { keysOnly: true, writeMarker: true }

    while(batches < maxBatches) {
      const summary = await db.clearOpLogs(cutoff, batchSize, clearOptions)
      batches++
      const batchDeleted = summary.count || 0
      deleted += batchDeleted
      let maxCount = 0
      for(const result of summary.results || []) {
        if((result.count || 0) > maxCount) maxCount = result.count
      }
      const stillFullBatches = maxCount >= batchSize
      const now = Date.now()
      recentSamples.push({ t: now, deleted })
      while(recentSamples.length > 1 && now - recentSamples[0].t > RECENT_RATE_WINDOW_MS) {
        recentSamples.shift()
      }
      const oldest = recentSamples[0]
      const recentDeleted = deleted - oldest.deleted
      const recentWindowMs = Math.max(1, now - oldest.t)

      const progress = this.computeProgress({
        deleted,
        estimatedDeletable,
        startedAt: runStartedAt,
        recentDeleted,
        recentWindowMs,
        stillFullBatches
      })
      estimatedDeletable = progress.estimatedDeletable

      this.setStatus({
        dbName,
        batch: (this.status.batch || 0) + 1,
        deleted,
        lastDeleted: batchDeleted,
        estimatedDeletable,
        progressPercent: progress.progressPercent,
        ratePerSec: progress.ratePerSec,
        etaMs: progress.etaMs,
        message: `cleaning ${dbName} batch ${batches}`
      })

      if(batchDeleted > 0 && (now - lastLogAt >= PROGRESS_LOG_EVERY_MS || batches === 1)) {
        lastLogAt = now
        this.logProgress(mode, this.status)
      }

      if(!stillFullBatches) break
      if(delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs))
    }

    const dbDeleted = deleted - deletedBeforeDb
    console.info(
      `[OpLogCleaner] ${mode} db=${dbName} finished`
      + ` deleted=${formatCount(dbDeleted)}`
      + ` batches=${batches}`
    )
    return { skipped: false, batches, deleted: dbDeleted }
  }

  /**
   * Startup path: drain each opLog store fully with keysOnly and no per-batch markers,
   * then write a single clearOpLog marker per store.
   */
  async cleanDatabaseStartup(db, dbName, ctx) {
    const {
      cutoff, batchSize, maxBatches, delayMs, mode, runStartedAt, deletedBeforeDb
    } = ctx
    let estimatedDeletable = ctx.estimatedDeletable
    let batches = 0
    let deleted = deletedBeforeDb
    let lastLogAt = 0
    const recentSamples = [{ t: Date.now(), deleted }]
    const deleteBeforeStr = padTimestamp(cutoff)

    const stores = []
    for(const name in db.config.tables) {
      stores.push({ type: 'table', name, getOpLog: () => db.table(name).opLog, getWritter: () => db.table(name).opLogWritter })
    }
    for(const name in db.config.indexes) {
      stores.push({
        type: 'index',
        name,
        getOpLog: () => {
          const index = db.indexes.get(name)
          if(index) return index.opLog
          const config = db.config.indexes[name]
          return db.store(config.uid + '.opLog', { ...config, ...config.opLog })
        },
        getWritter: () => {
          const index = db.indexes.get(name)
          return index ? index.opLogWritter : null
        }
      })
    }

    for(const storeInfo of stores) {
      let opLog
      try {
        opLog = storeInfo.getOpLog()
      } catch(err) {
        debug('startup skip store', storeInfo.name, err)
        continue
      }
      const first = (await opLog.rangeGet({ gt: '', limit: 1 }))[0]
      if(!first || first.id >= deleteBeforeStr) continue

      const fromId = first.id
      let storeDeleted = 0
      let storeBatches = 0
      while(storeBatches < maxBatches) {
        let batchResult
        if(storeInfo.type === 'table') {
          batchResult = await db.table(storeInfo.name).clearOpLog(cutoff, batchSize, {
            keysOnly: true,
            writeMarker: false
          })
        } else {
          batchResult = await db.clearIndexOpLogByConfig(
            storeInfo.name,
            db.config.indexes[storeInfo.name],
            cutoff,
            batchSize,
            { keysOnly: true, writeMarker: false }
          )
        }
        storeBatches++
        batches++
        const batchDeleted = batchResult.count || 0
        storeDeleted += batchDeleted
        deleted += batchDeleted

        const stillFull = batchDeleted >= batchSize
        const now = Date.now()
        recentSamples.push({ t: now, deleted })
        while(recentSamples.length > 1 && now - recentSamples[0].t > RECENT_RATE_WINDOW_MS) {
          recentSamples.shift()
        }
        const oldest = recentSamples[0]
        const progress = this.computeProgress({
          deleted,
          estimatedDeletable,
          startedAt: runStartedAt,
          recentDeleted: deleted - oldest.deleted,
          recentWindowMs: Math.max(1, now - oldest.t),
          stillFullBatches: stillFull
        })
        estimatedDeletable = progress.estimatedDeletable
        this.setStatus({
          dbName,
          batch: (this.status.batch || 0) + 1,
          deleted,
          lastDeleted: batchDeleted,
          estimatedDeletable,
          progressPercent: progress.progressPercent,
          ratePerSec: progress.ratePerSec,
          etaMs: progress.etaMs,
          message: `cleaning ${dbName} ${storeInfo.type}:${storeInfo.name}`
        })
        if(batchDeleted > 0 && (now - lastLogAt >= PROGRESS_LOG_EVERY_MS || batches === 1)) {
          lastLogAt = now
          this.logProgress(mode, this.status)
        }
        if(!stillFull) break
        if(delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs))
      }

      if(storeDeleted > 0) {
        const writter = storeInfo.getWritter() || createOpLogWritter(opLog)
        await writeClearOpLogMarker(opLog, writter, fromId, deleteBeforeStr)
      }
    }

    const dbDeleted = deleted - deletedBeforeDb
    console.info(
      `[OpLogCleaner] ${mode} db=${dbName} finished`
      + ` deleted=${formatCount(dbDeleted)}`
      + ` batches=${batches}`
    )
    return { skipped: false, batches, deleted: dbDeleted }
  }
}

export default OpLogCleaner
export {
  DEFAULT_INTERVAL_MS,
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_BATCHES_PER_DB,
  DEFAULT_DELAY_MS,
  STARTUP_DELAY_MS
}
