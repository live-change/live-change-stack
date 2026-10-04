/**
 * In-memory timer queue mutations. Pure: no App / service definition.
 */

/**
 * Insert timer sorted by timestamp. Dedupes by id.
 *
 * @param {Array<{ id: string, timestamp: number }>} queue
 * @param {Map<string, { id: string, timestamp: number }>} byId
 * @param {{ id: string, timestamp: number }} timer
 * @returns {{ inserted: boolean, index: number }}
 */
export function insertTimerSorted(queue, byId, timer) {
  if (!timer?.id) return { inserted: false, index: -1 }
  if (byId.has(timer.id)) return { inserted: false, index: -1 }
  byId.set(timer.id, timer)
  for (let i = 0; i < queue.length; i++) {
    if (timer.timestamp < queue[i].timestamp) {
      queue.splice(i, 0, timer)
      return { inserted: true, index: i }
    }
  }
  queue.push(timer)
  return { inserted: true, index: queue.length - 1 }
}

/**
 * Remove timer from queue and map. Iterates backward so splice is safe.
 *
 * @param {Array<{ id: string }>} queue
 * @param {Map<string, unknown>} byId
 * @param {string} timerId
 */
export function removeTimerFromQueue(queue, byId, timerId) {
  for (let i = queue.length - 1; i >= 0; i--) {
    if (queue[i].id === timerId) queue.splice(i, 1)
  }
  byId.delete(timerId)
}
