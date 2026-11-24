const OPLOG_KEY = /^(\d{16}):/
const MAX_ID_LENGTH = 120

function truncate(text) {
  if(text.length <= MAX_ID_LENGTH) return text
  return text.slice(0, MAX_ID_LENGTH - 3) + '...'
}

// OpLog ids are Date.now() padded to 16 digits, then ':' and a counter.
function formatCursor(key) {
  if(key == null || key === '') return null
  const text = String(key)
  const match = OPLOG_KEY.exec(text)
  if(match) {
    const ms = Number(match[1])
    if(Number.isFinite(ms)) {
      return { kind: 'oplog', at: new Date(ms).toISOString(), key: truncate(text) }
    }
  }
  return { kind: 'id', id: truncate(text) }
}

function indexSources(index) {
  const config = index.configObservable && index.configObservable.value
  const sources = config && config.sources
  if(!Array.isArray(sources)) return []
  return sources.map(source => `${source.type} ${source.name}`)
}

// Reads state the index already keeps. Does not write anything.
// cursorAt stays null: activity has no timestamp. The reporter tracks age itself.
function formatIndexProgress(index) {
  const phase = index.lastPhase === 'creating' || index.lastPhase === 'updating'
    ? index.lastPhase
    : null
  const activity = index.activity && index.activity.observable && index.activity.observable.value
  const cursor = phase === 'updating' && activity ? activity.lastKey ?? null : null
  return {
    phase,
    sources: indexSources(index),
    cursor,
    cursorAt: null
  }
}

export { formatCursor, formatIndexProgress, MAX_ID_LENGTH }
