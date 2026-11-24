import { createHash } from 'crypto'

export const TOKEN_TOUCH_MS = 60 * 60 * 1000

export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex')
}

export function extractToken(req) {
  const header = req?.headers?.authorization || req?.headers?.Authorization
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    const token = header.slice(7).trim()
    if (token) return token
  }
  const url = req?.url || ''
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : ''
  const token = new URLSearchParams(query).get('token')
  return token || null
}

export function shouldTouchToken(lastUsedAt, now = new Date(), intervalMs = TOKEN_TOUCH_MS) {
  if (!lastUsedAt) return true
  const then = new Date(lastUsedAt).getTime()
  if (Number.isNaN(then)) return true
  return now.getTime() - then >= intervalMs
}

export function rejectionReason(row) {
  if (!row) return 'invalid token'
  if (row.revokedAt) return 'revoked token'
  return null
}
