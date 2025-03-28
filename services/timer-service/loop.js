import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import { queueDuration, loadMoreAfter } from './config.js'


let timersQueue = []
let timersById = new Map()
let timersLoopStarted = false
let timersLoopTimeout = false
let lastLoadTime = 0


export function runTimerAction(timer) {
/*  console.error("RUN ACTION", timer)
  console.trace("RUN ACTION")*/
  if(timer.command) {
    if(!timer.command.service) timer.command.service = timer.service
    return app.command({
      ...timer.command,
      origin: { ...(timer.origin || {}), through: "timer" }
    })
  }
  if(timer.trigger) {
    if(timer.service) {
      return app.triggerService({
        ...timer.trigger, service: timer.service,
        causeType: 'timer',
        cause: timer.id
      }, {
        ...timer.trigger.data,
        origin: { ...(timer.origin || {}), through: "timer" }
      })
    } else {
      return app.trigger({ ...timer.trigger }, {
        ...timer.trigger.data,
        origin: { ...(timer.origin || {}), through: "timer" }
      })
    }
  }
  return new Promise((resolve, reject) => resolve(true))
}

export function fireTimer(timer) {
  runTimerAction(timer).catch(error => {
    console.error("TIMER ACTION ERROR", error)
    let timestamp = Date.now() + timer.retryDelay
    timer.retries ++
    if(timer.retries > timer.maxRetries) {
      app.emitEvents("timer", [{
        type: "timerFinished",
        timer: timer.id,
        error
      }], { ...(timer.origin || {}), through: 'timer' })
      timersById.delete(timer.id)
    } else { // Retry
      app.emitEvents("timer", [{
        type: "timerFailed",
        timer: timer.id,
        error, timestamp,
        retries: timer.retries
      }], { ...(timer.origin || {}), through: 'timer' })
      timer.timestamp = timestamp
      insertTimer(timer)
    }
  }).then(done => {
    console.error("TIMER ACTION FINISHED", done)
    timer.loops --
    if(timer.loops < 0) {
      console.log("TIMER FINISHED")
      app.emitEvents("timer",[{
        type: "timerFinished",
        timer: timer.id
      }], { ...(timer.origin || {}), through: 'timer' })
      timersById.delete(timer.id)
    } else {
      let timestamp = timer.timestamp + timer.interval
      console.log("TIMER FIRED")
      app.emitEvents("timer",[{
        type: "timerFired",
        timer: timer.id,
        timestamp,
        loops: timer.loops
      }], { ...(timer.origin || {}), through: 'timer' })
      timer.timestamp = timestamp
      insertTimer(timer)
    }
  })
}
  


async function timersLoop() {
  //console.log("TL", timersQueue.length, timersQueue[0] && (timersQueue[0].timestamp - Date.now()))
  timersLoopTimeout = false
  if(timersQueue.length === 0) {
    timersLoopStarted = false
    setTimeout(checkIfThereIsMore, loadMoreAfter)
    return
  }
  let nextTs = timersQueue[0].timestamp
  let now = Date.now()
  //console.log("NEXT TS", nextTs, '<', now, '-->', nextTs < now, "INQ", timersQueue)
  while(nextTs < now) {
    fireTimer(timersQueue.shift())
    if(timersQueue.length === 0) {
      timersLoopStarted = false
      setTimeout(checkIfThereIsMore, loadMoreAfter)
      return
    }
    nextTs = timersQueue[0].timestamp
  }
  let delay = nextTs - Date.now()
  if(delay > 1000) delay = 1000
  await maybeLoadMore()
  if(timersLoopTimeout === false) {
    timersLoopTimeout = setTimeout(timersLoop, delay)
  }
}

export function startTimersLoop() {
  timersLoopStarted = true
  timersLoop()
}

function resetTimersLoop() {
  if(timersLoopTimeout !== false) clearTimeout(timersLoopTimeout)
  timersLoop()
}

function appendTimers(timers) {
  for(let timer of timers) {
    if(!timersById.has(timer.id)) {
      timersQueue.push(timer)
      timersById.set(timer.id, timer)
    }
  }
}

async function maybeLoadMore() {
  if(!(lastLoadTime - Date.now() < loadMoreAfter)) return
  let loadTime = Date.now() + queueDuration
  let timers = await app.dao.get(['database', 'query', app.databaseName, `(${
    async (input, output, { encodedFrom, encodedTo }) => {
      const mapper = async (res) => input.table('timer_Timer').object(res.to).get()
      await input.index('timer_Timer_timestamp').range({
        gte: encodedFrom,
        lt: encodedTo
      }).onChange(async (obj, oldObj) => {
        output.change(obj && await mapper(obj), oldObj && await mapper(oldObj))
      })
    }
  })`, { encodedFrom: (''+lastLoadTime).padStart(16, '0')+'_', encodedTo: (''+loadTime).padStart(16, '0')+'_' }])
  lastLoadTime = loadTime
  for(let timer of timers) {
    insertTimer(timer)
  }
}

async function checkIfThereIsMore() {
  if(timersLoopStarted) return // loop started
  let loadTime = Date.now() + queueDuration
  //console.log("CHECK IF THERE IS MORE?", loadTime)
  let timers = await app.dao.get(['database', 'query', app.databaseName, `(${
    async (input, output, { encodedFrom, encodedTo }) => {
      const mapper = async (res) => input.table('timer_Timer').object(res.to).get()
      await input.index('timer_Timer_timestamp').range({
        gte: encodedFrom,
        lt: encodedTo
      }).onChange(async (obj, oldObj) => {
        output.change(obj && await mapper(obj), oldObj && await mapper(oldObj))
      })
    }
  })`, { encodedFrom: '', encodedTo: (''+loadTime).padStart(16, '0')+'_' }])
  if(timers.length === 0) {
    //console.log("NO MORE")
    if(!timersLoopStarted) setTimeout(checkIfThereIsMore, loadMoreAfter)
    return
  }
  lastLoadTime = loadTime
  appendTimers(timers)
  if(!timersLoopStarted) startTimersLoop()
}


export async function startTimers() {
  console.error("START TIMERS")

  let loadTime = Date.now() + queueDuration

  let timers = await app.dao.get(['database', 'query', app.databaseName, `(${
    async (input, output, { encodedFrom, encodedTo }) => {
      const mapper = async (res) => input.table('timer_Timer').object(res.to).get()
      await input.index('timer_Timer_timestamp').range({
        gte: encodedFrom,
        lt: encodedTo
      }).onChange(async (obj, oldObj) => {
        output.change(obj && await mapper(obj), oldObj && await mapper(oldObj))
      })
    }
  })`, { encodedFrom: '', encodedTo: (''+loadTime).padStart(16, '0')+'_' }])
  console.error("NEXT TIMERS", timers)
  lastLoadTime = loadTime
  appendTimers(timers)
  if(!timersLoopStarted) startTimersLoop()
}

export function insertTimer(timer) {
  //console.log("INSERT TIMER", timer, "TO", timersQueue)
  if(timersById.has(timer.id)) return //throw new Error("INSERT TIMER DUPLICATED!!!")
  timersById.set(timer.id, timer)
  for(let i = 0; i < timersQueue.length; i++) {
    if(timer.timestamp < timersQueue[i].timestamp) {
      timersQueue.splice(i, 0, timer)
      if(i === 0) { // reset timers loop
        resetTimersLoop()
      }
      return;
    }
  }
  timersQueue.push(timer)
  if(!timersLoopStarted) {
    startTimersLoop()
  } else if(timer.timestamp - Date.now() < 1000) {
    resetTimersLoop()
  }
}

export function removeTimer(timerId) {
  for(let i = 0; i < timersQueue; i++) {
    if(timersQueue[i].id === timerId) {
      timersQueue.splice(i, 1)
    }
  }
  timersById.delete(timerId)
}

definition.afterStart(async () => {
  await startTimers()
})