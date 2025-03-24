import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import { Timer } from './model.js'
import { insertTimer, removeTimer, startTimers } from './loop.js'
import { queueDuration, loadMoreAfter } from './config.js'

definition.trigger({
  name: "createTimer",
  properties: {
    timer: {
      type: Object
    }
  },
  async execute({ timer }, { client, service, trigger }, emit) {
    if(!timer) throw new Error("timer is required")
    let timestamp = timer.timestamp && new Date(timer.timestamp).getTime()
    let time = timer.time && new Date(timer.time)
    if((!time) && (!timestamp)) {
      console.log("TIMER", timer, "TIME", time, "TIMESTAMP", timestamp)
      throw new Error("timestamp or time is required")
    }
    if(!timestamp) timestamp = time.getTime()
    if(!time) time = new Date(timestamp)
    let loops = timer.loops || 0
    let timerId = timer.id || app.generateUid()
    let maxRetries = timer.maxRetries || 0
    let retryDelay = timer.retryDelay || 5 * 1000
    let interval = timer.interval || 0
    if(loops > 0 && interval === 0) throw new Error("impossibleTimer")
    const props = {
      ...timer, timestamp, time, loops, interval, timerId, maxRetries, retryDelay, retries: 0,
      causeType: trigger.causeType,
      cause: trigger.cause
    }
    emit({
      type: "timerCreated",
      timer: timerId,
      data: props
    })
    if(timestamp < Date.now() + queueDuration) {
      insertTimer({ ...props , id: timerId })
    }
    return timerId
  }
})


definition.trigger({
  name: "cancelTimer",
  properties: {
    timer: {
      type: Timer
    }
  },
  async execute({ timer }, { client, service }, emit) {
    if(!timer) throw new Error("timer is required")
    let timerRow = await Timer.get(timer)
    if(!timerRow) throw 'notFound'
    emit({
      type: "timerCanceled", timer
    })
    removeTimer(timer)
    return true
  }
})

definition.trigger({
  name: "cancelTimerIfExists",
  properties: {
    timer: {
      type: Timer
    }
  },
  async execute({ timer }, { client, service }, emit) {
    if(!timer) throw new Error("timer is required")
    let timerRow = await Timer.get(timer)
    if(!timerRow) return false
    emit({
      type: "timerCanceled", timer
    })
    removeTimer(timer)
    return true
  }
})

definition.afterStart(async () => {
  await startTimers()
})

export default definition
