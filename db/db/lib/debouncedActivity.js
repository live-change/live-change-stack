import ReactiveDao from '@live-change/dao'

const DEFAULT_DEBOUNCE_MS = 500

function createDebouncedActivity(debounceMs = DEFAULT_DEBOUNCE_MS) {
  const observable = new ReactiveDao.ObservableValue({
    busy: false,
    lastKey: null,
    error: null
  })
  observable.observe(() => {})

  let pendingBusy = false
  let pendingLastKey = null
  let pendingError = null
  let lastTouchAt = 0
  let timer = null

  function clearTimer() {
    if(timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function publish(next) {
    observable.set(next)
  }

  function schedule() {
    if(timer) return
    timer = setTimeout(() => {
      timer = null
      const quiet = Date.now() - lastTouchAt >= debounceMs
      if(pendingBusy) {
        publish({
          busy: true,
          lastKey: pendingLastKey,
          error: pendingError
        })
        if(quiet) {
          pendingBusy = false
          schedule()
        } else {
          schedule()
        }
      } else {
        publish({
          busy: false,
          lastKey: pendingLastKey,
          error: pendingError
        })
      }
    }, debounceMs)
  }

  function touch(lastKey) {
    lastTouchAt = Date.now()
    pendingBusy = true
    if(lastKey !== undefined) pendingLastKey = lastKey
    pendingError = null
    schedule()
  }

  function idle() {
    clearTimer()
    pendingBusy = false
    lastTouchAt = 0
    publish({
      busy: false,
      lastKey: pendingLastKey,
      error: pendingError
    })
  }

  function setError(error, lastKey) {
    clearTimer()
    pendingBusy = false
    lastTouchAt = 0
    pendingError = error == null ? null : String(error)
    if(lastKey !== undefined) pendingLastKey = lastKey
    publish({
      busy: false,
      lastKey: pendingLastKey,
      error: pendingError
    })
  }

  function clearError() {
    pendingError = null
    const current = observable.value || {}
    publish({
      busy: !!current.busy,
      lastKey: current.lastKey ?? pendingLastKey,
      error: null
    })
  }

  return {
    observable,
    touch,
    idle,
    setError,
    clearError
  }
}

export { createDebouncedActivity, DEFAULT_DEBOUNCE_MS }
export default createDebouncedActivity
