const DEFAULT_OP_LOG_RETENTION_MS = 2 * 60 * 60 * 1000

function resolveOpLogRetentionMs(dbConfig, serverDefault = DEFAULT_OP_LOG_RETENTION_MS) {
  const value = dbConfig?.storage?.opLogRetentionMs
  if(value === false) return false
  if(value === 0 || (typeof value === 'number' && value < 0)) return false
  if(typeof value === 'number' && value > 0) return value
  if(serverDefault === false) return false
  if(typeof serverDefault === 'number' && serverDefault > 0) return serverDefault
  return DEFAULT_OP_LOG_RETENTION_MS
}

export {
  DEFAULT_OP_LOG_RETENTION_MS,
  resolveOpLogRetentionMs
}
