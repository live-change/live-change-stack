const SAFE_NAME = /^[A-Za-z0-9_.-]+$/

export function tableName(name) {
  if(typeof name === 'string' && SAFE_NAME.test(name)) return name
  return 's_' + Buffer.from(String(name || ''), 'utf8').toString('hex')
}

export function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"'
}

export function createTableSql(quoted) {
  return `CREATE TABLE IF NOT EXISTS ${quoted} (
    id TEXT NOT NULL COLLATE BINARY PRIMARY KEY,
    value TEXT NOT NULL
  ) WITHOUT ROWID`
}

export function applyPragmas(db, { mapSize } = {}) {
  db.pragma('page_size = 4096')
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('temp_store = MEMORY')
  const mmap = mapSize || (256 * 1024 * 1024)
  db.pragma('mmap_size = ' + mmap)
  db.pragma('cache_size = -65536')
  db.pragma('locking_mode = EXCLUSIVE')
  db.pragma('busy_timeout = 5000')
  db.pragma('foreign_keys = OFF')
  db.pragma('wal_autocheckpoint = 1000')
}
