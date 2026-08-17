import crypto from 'crypto'

/**
 * Stable id for a push subscription endpoint.
 * @param {string} endpoint
 */
export function webSubscriptionId(endpoint) {
  const value = String(endpoint ?? '')
  if (!value) throw new Error('endpoint_required')
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 40)
}
