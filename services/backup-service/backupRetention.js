export const DEFAULT_MIN_BACKUPS = 10
export const DEFAULT_MAX_AGE_MS = 10 * 24 * 3600 * 1000
export const DEFAULT_CLEANUP_INCOMPLETE = true

export function parseNonNegInt(value) {
  if(value == null || value === '') return null
  if(typeof value === 'number') {
    if(!Number.isInteger(value) || value < 0) return null
    return value
  }
  if(typeof value !== 'string') return null
  const trimmed = value.trim()
  if(trimmed === '') return null
  const n = Number(trimmed)
  if(!Number.isInteger(n) || n < 0) return null
  return n
}

export function parseBool(value, defaultValue) {
  if(value == null || value === '') return defaultValue
  if(typeof value === 'boolean') return value
  const s = String(value).trim().toLowerCase()
  if(s === '0' || s === 'false' || s === 'off' || s === 'no') return false
  if(s === '1' || s === 'true' || s === 'on' || s === 'yes') return true
  return defaultValue
}

function firstNonNegInt(values) {
  for(const value of values) {
    const parsed = parseNonNegInt(value)
    if(parsed != null) return parsed
  }
  return null
}

export function resolveBackupFileRetention({ env = {}, config = {} } = {}) {
  const minRaw = firstNonNegInt([env.BACKUP_MIN_COUNT, config.minBackups])
  const minBackups = Math.max(1, minRaw ?? DEFAULT_MIN_BACKUPS)

  const maxRaw = firstNonNegInt([env.BACKUP_MAX_AGE_MS, config.maxAgeMs])
  const maxAgeMs = maxRaw ?? DEFAULT_MAX_AGE_MS

  let cleanupIncomplete = DEFAULT_CLEANUP_INCOMPLETE
  if(env.BACKUP_CLEAN_INCOMPLETE != null && String(env.BACKUP_CLEAN_INCOMPLETE).trim() !== '') {
    cleanupIncomplete = parseBool(env.BACKUP_CLEAN_INCOMPLETE, DEFAULT_CLEANUP_INCOMPLETE)
  } else if(typeof config.cleanupIncomplete === 'boolean') {
    cleanupIncomplete = config.cleanupIncomplete
  }

  return { minBackups, maxAgeMs, cleanupIncomplete }
}
