/**
 * Shared [startup] logger — absolute ISO time, +since process start, Δ since last log.
 */

const processStartMs = Date.now()
let lastLogMs = processStartMs

function formatMs(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * @param {...unknown} args
 */
export function startupLog(...args) {
  const now = Date.now()
  const sinceStart = now - processStartMs
  const delta = now - lastLogMs
  lastLogMs = now
  const iso = new Date(now).toISOString()
  console.log(`[startup ${iso} +${formatMs(sinceStart)} Δ${formatMs(delta)}]`, ...args)
}

/**
 * @template T
 * @param {string} label
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function startupTimed(label, fn) {
  const t0 = Date.now()
  startupLog(label, 'begin')
  try {
    const result = await fn()
    startupLog(label, 'done', `in ${formatMs(Date.now() - t0)}`)
    return result
  } catch (err) {
    startupLog(label, 'FAILED', `after ${formatMs(Date.now() - t0)}`, err?.message || err)
    throw err
  }
}

export { formatMs }
export default startupLog
