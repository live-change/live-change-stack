function parseDumpLine(line) {
  const trimmed = typeof line === 'string' ? line.trim() : ''
  if(!trimmed) return { skip: true }
  try {
    return { command: JSON.parse(trimmed) }
  } catch(error) {
    return {
      error: error.message || String(error),
      preview: trimmed.slice(0, 120)
    }
  }
}

function methodName(command) {
  const method = command && command.method
  if(!Array.isArray(method) || method.length === 0) return null
  return method[method.length - 1]
}

function isCreateIndex(command) {
  return methodName(command) === 'createIndex'
}

function isPut(command) {
  return methodName(command) === 'put'
}

function isPutOldLog(command) {
  return methodName(command) === 'putOldLog'
}

function putTableName(command) {
  if(!isPut(command) && !isPutOldLog(command)) return null
  const parameters = command && command.parameters
  if(!Array.isArray(parameters) || parameters.length < 2) return null
  return parameters[1]
}

function putObjectId(command) {
  if(!isPut(command) && !isPutOldLog(command)) return null
  const parameters = command && command.parameters
  if(!Array.isArray(parameters) || parameters.length < 3) return null
  const object = parameters[2]
  if(!object || typeof object !== 'object') return null
  return object.id ?? null
}

function shouldRunRequest(command, options = {}) {
  const {
    skipIndex = false,
    onlyIndex = false,
    excludeTables = []
  } = options
  const excludeSet = excludeTables instanceof Set
    ? excludeTables
    : new Set(Array.isArray(excludeTables) ? excludeTables : [])

  if(command && command.type === 'sync') return true
  if(!command || command.type !== 'request') return false

  if(onlyIndex) return isCreateIndex(command)
  if(skipIndex && isCreateIndex(command)) return false

  if(excludeSet.size > 0 && (isPut(command) || isPutOldLog(command))) {
    const tableName = putTableName(command)
    if(tableName != null && excludeSet.has(tableName)) return false
  }

  return true
}

function statsMapKey(kind, name) {
  return kind + '\0' + name
}

function accumulateDumpStats(statsMap, command, lineByteLength) {
  if(!command || command.type !== 'request') return
  let kind = null
  if(isPut(command)) kind = 'table'
  else if(isPutOldLog(command)) kind = 'log'
  else return

  const name = putTableName(command)
  if(name == null) return

  const bytes = Number(lineByteLength) || 0
  const key = statsMapKey(kind, name)
  const existing = statsMap.get(key)
  if(existing) {
    existing.entries += 1
    existing.bytes += bytes
  } else {
    statsMap.set(key, { kind, name, entries: 1, bytes })
  }
}

function dumpStatsRows(statsMap) {
  return Array.from(statsMap.values())
}

function sortDumpStats(rows, sortBy = 'bytes') {
  const key = sortBy === 'entries' ? 'entries' : 'bytes'
  return [...rows].sort((a, b) => {
    const diff = b[key] - a[key]
    if(diff !== 0) return diff
    if(a.kind !== b.kind) return a.kind < b.kind ? -1 : 1
    return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)
  })
}

function formatHumanBytes(bytes) {
  const n = Number(bytes) || 0
  if(n < 1024) return String(n)
  const units = ['KiB', 'MiB', 'GiB', 'TiB']
  let value = n
  let unitIndex = -1
  while(value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  const rounded = value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)
  return rounded + units[unitIndex]
}

function formatDumpStatsTable(rows, options = {}) {
  const { human = false } = options
  const list = Array.isArray(rows) ? rows : []
  let totalEntries = 0
  let totalBytes = 0
  for(const row of list) {
    totalEntries += row.entries
    totalBytes += row.bytes
  }

  const formatBytes = (n) => human ? formatHumanBytes(n) : String(n)
  const kindWidth = Math.max(4, ...list.map((r) => String(r.kind).length), 0)
  const nameWidth = Math.max(4, 5, ...list.map((r) => String(r.name).length))
  const entriesWidth = Math.max(
    7,
    String(totalEntries).length,
    ...list.map((r) => String(r.entries).length)
  )
  const bytesWidth = Math.max(
    5,
    formatBytes(totalBytes).length,
    ...list.map((r) => formatBytes(r.bytes).length)
  )

  const lines = []
  lines.push(
    'KIND'.padEnd(kindWidth) + '  ' +
    'NAME'.padEnd(nameWidth) + '  ' +
    'ENTRIES'.padStart(entriesWidth) + '  ' +
    'BYTES'.padStart(bytesWidth)
  )
  for(const row of list) {
    lines.push(
      String(row.kind).padEnd(kindWidth) + '  ' +
      String(row.name).padEnd(nameWidth) + '  ' +
      String(row.entries).padStart(entriesWidth) + '  ' +
      formatBytes(row.bytes).padStart(bytesWidth)
    )
  }
  lines.push(
    ''.padEnd(kindWidth) + '  ' +
    'TOTAL'.padEnd(nameWidth) + '  ' +
    String(totalEntries).padStart(entriesWidth) + '  ' +
    formatBytes(totalBytes).padStart(bytesWidth)
  )
  return lines.join('\n')
}

export {
  parseDumpLine,
  methodName,
  isCreateIndex,
  isPut,
  isPutOldLog,
  putTableName,
  putObjectId,
  shouldRunRequest,
  accumulateDumpStats,
  dumpStatsRows,
  sortDumpStats,
  formatHumanBytes,
  formatDumpStatsTable
}
