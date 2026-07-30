import PQueue from 'p-queue'

const DEFAULT_CONCURRENCY = 4

let queue = new PQueue({ concurrency: DEFAULT_CONCURRENCY })

export function getDeleteCascadeQueue() {
  return queue
}

export function configureDeleteCascadeQueue(options = {}) {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
  if(queue.concurrency !== concurrency) {
    queue.concurrency = concurrency
  }
  return queue
}

/**
 * Enqueue work on the global delete-cascade queue.
 * Use for runtime.delete and any custom cascade-related jobs.
 * Does not swallow errors — callers that fire-and-forget should .catch().
 */
export function enqueueDeleteCascade(fn) {
  return queue.add(fn)
}

export function sleep(ms) {
  if(!ms || ms <= 0) return Promise.resolve()
  return new Promise(resolve => setTimeout(resolve, ms))
}
