import { formatCursor } from '@live-change/db/lib/indexProgress.js'

const TICK_MS = 10 * 1000

function ageSec(from, now) {
  return Math.max(0, Math.round((now - from) / 1000))
}

function formatBusyLine(dbName, row, seen, now) {
  const key = dbName + ':' + row.name
  const prev = seen.get(key)
  const cursor = row.cursor == null ? null : String(row.cursor)
  const sameCursor = prev && prev.phase === row.phase && prev.cursor === cursor
  const cursorAt = sameCursor ? prev.cursorAt : now
  const phaseAt = prev && prev.phase === row.phase ? prev.phaseAt : now
  seen.set(key, { phase: row.phase, cursor, cursorAt, phaseAt })

  const sources = row.sources && row.sources.length ? row.sources.join(', ') : null
  let detail = ''
  if(row.phase === 'updating') {
    const formatted = formatCursor(row.cursor)
    if(formatted && formatted.kind === 'oplog') {
      detail = ` oplog=${formatted.at} (${ageSec(cursorAt, now)}s ago)`
    } else if(formatted && formatted.kind === 'id') {
      detail = ` id=${formatted.id} (${ageSec(cursorAt, now)}s ago)`
    } else {
      detail = ' oplog=(waiting)'
    }
  } else {
    detail = ` ${ageSec(phaseAt, now)}s`
  }
  const sourcePart = sources
    ? (row.phase === 'updating' ? ` source=${sources}` : ` sources=${sources}`)
    : ''
  return `[db:${dbName}] ${row.phase} ${row.name}${sourcePart}${detail}`
}

function attachStartupProgress(server) {
  if(server.startupProgress) return server.startupProgress
  const progress = {
    step: null,
    stepAt: 0,
    seen: new Map(),
    setStep(step) {
      this.step = step
      this.stepAt = Date.now()
    },
    clearStep() {
      this.step = null
    },
    tick() {
      const now = Date.now()
      const lines = []
      if(this.step) {
        lines.push(`[db] ${this.step} (${ageSec(this.stepAt, now)}s)`)
      }
      const busyKeys = new Set()
      for(const [dbName, database] of server.databases) {
        if(dbName === 'system') continue
        if(!database || typeof database.busyIndexes !== 'function') continue
        for(const row of database.busyIndexes()) {
          busyKeys.add(dbName + ':' + row.name)
          lines.push(formatBusyLine(dbName, row, this.seen, now))
        }
      }
      for(const key of this.seen.keys()) {
        if(!busyKeys.has(key)) this.seen.delete(key)
      }
      if(!lines.length) return
      for(const line of lines) console.info(line)
    },
    stop() {
      if(this.timer) clearInterval(this.timer)
      this.timer = null
    }
  }
  progress.timer = setInterval(() => progress.tick(), TICK_MS)
  if(progress.timer.unref) progress.timer.unref()
  server.startupProgress = progress
  return progress
}

export { attachStartupProgress, formatBusyLine, TICK_MS }
