const TICK_MS = 10 * 1000

const stack = []
let timer = null

function ageSec(from, now = Date.now()) {
  return Math.max(0, Math.round((now - from) / 1000))
}

function tick() {
  if(!stack.length) return
  const top = stack[stack.length - 1]
  console.info(`[startup] ${top.label} (${ageSec(top.since)}s)`)
}

function ensureTimer() {
  if(timer) return
  timer = setInterval(tick, TICK_MS)
  if(timer.unref) timer.unref()
}

function pushStartupPhase(label) {
  stack.push({ label, since: Date.now() })
  ensureTimer()
}

function popStartupPhase() {
  stack.pop()
  if(!stack.length && timer) {
    clearInterval(timer)
    timer = null
  }
}

function clearStartupPhases() {
  stack.length = 0
  if(timer) {
    clearInterval(timer)
    timer = null
  }
}

async function withStartupPhase(label, fn) {
  pushStartupPhase(label)
  try {
    return await fn()
  } finally {
    popStartupPhase()
  }
}

export {
  pushStartupPhase,
  popStartupPhase,
  clearStartupPhases,
  withStartupPhase,
  TICK_MS
}
