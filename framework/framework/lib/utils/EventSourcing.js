import EventsReader from './EventsReader.js'
import ReactiveDao from '@live-change/dao'

function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))
}

class EventSourcing {
  constructor(connection, database, logName, consumerName, config = {}) {
    this.connection = connection
    this.database = database
    this.logName = logName
    this.consumerName = consumerName
    this.consumerId = this.logName + '.' + this.consumerName
    this.config = config
    this.reader = null
    this.lastPositionSave = Date.now()
    this.lastSavedPosition = 0
    this.savePromise = null
    this.saveTimer = null
    this.saveTimerResolve = null
    this.skipSaveThrottle = false
    this.allEventHandlers = []
    this.eventTypeHandlers = new Map()
    this.onBucketEnd = () => {}
  }

  saveThrottleMs() {
    return this.config.saveThrottle || 1000
  }

  clearSaveTimer() {
    if(this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    if(this.saveTimerResolve) {
      const resolve = this.saveTimerResolve
      this.saveTimerResolve = null
      resolve()
    }
  }

  scheduleSave(delay) {
    if(this.saveTimer || this.savePromise) return
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      this.saveTimerResolve = null
      this.ensureSave()
    }, delay)
  }

  ensureSave() {
    if(this.savePromise) return
    if(!this.state || this.lastSavedPosition == this.state.position) return
    const run = this.flushSave()
    this.savePromise = run
    run.then(() => {
      if(this.savePromise === run) this.savePromise = null
    }, err => {
      if(this.savePromise === run) this.savePromise = null
      console.error('EVENT SOURCING POSITION SAVE ERROR', err)
      // Leave dirty; retry on the next event or saveState/dispose. Do not busy-loop.
      this.scheduleSave(this.saveThrottleMs())
    })
  }

  async flushSave() {
    while(this.state && this.lastSavedPosition != this.state.position) {
      const snapshot = { ...this.state, position: this.state.position }
      const savedPosition = snapshot.position
      await this.connection.request(
        ['database', 'put'], this.database, 'eventConsumers', snapshot
      )
      this.lastSavedPosition = savedPosition
      this.lastPositionSave = Date.now()
      if(this.lastSavedPosition == this.state.position) break
      const wait = this.saveThrottleMs() - (Date.now() - this.lastPositionSave)
      if(wait > 0 && !this.skipSaveThrottle) {
        await new Promise(resolve => {
          this.saveTimerResolve = resolve
          this.saveTimer = setTimeout(() => {
            this.saveTimer = null
            this.saveTimerResolve = null
            resolve()
          }, wait)
        })
      }
    }
  }

  async dispose() {
    this.clearSaveTimer()
    if(this.reader) this.reader.dispose()
    await this.saveState()
  }

  async start() {
    await this.connection.request(['database', 'createTable'], this.database, 'eventConsumers', this.config.storage ?? {})
      .catch(e => 'ok')
    await this.connection.request(['database', 'createLog'], this.database, this.logName, this.config.storage ?? {})
      .catch(e => 'ok')
    this.state = await this.connection.get(
        ['database', 'tableObject', this.database, 'eventConsumers', this.consumerId])
    //console.log("GOT CONSUMER STATE", this.state)
    if(!this.state) {
      this.state = {
        id: this.consumerId,
        position: ''
      }
      await this.saveState()
    }
    this.reader = new EventsReader(
        this.state.position,
        (position, limit) => {
          // console.log("READ RANGE", { gt: position, limit })
          return this.connection.observable(
            ['database', 'logRange', this.database, this.logName, { gt: position, limit }],
            ReactiveDao.ObservableList)
        },
        async (event) => {
          const handledEvents = await this.handleEvent(event, event)
          this.onBucketEnd(event, handledEvents)
        },
        (position) => {
          this.state.position = position
          this.savePosition(position)
        },
        this.config.fetchSize || 100
    )
    await this.reader.start()
  }

  async saveState() {
    this.skipSaveThrottle = true
    this.clearSaveTimer()
    try {
      if(this.savePromise) {
        try {
          await this.savePromise
        } catch(e) {
          // Inflight fire-and-forget failed; retry below if still dirty.
        }
      }
      if(this.state && this.lastSavedPosition != this.state.position) {
        const run = this.flushSave()
        this.savePromise = run
        try {
          await run
        } finally {
          if(this.savePromise === run) this.savePromise = null
        }
      }
    } finally {
      this.skipSaveThrottle = false
    }
  }

  async handleEvent(event, mainEvent) {
    if(event.type == 'bucket') { // Handle buckets
      let handledEvents = []
      for(let i = 0; i < event.events.length; i++) {
        const subEvent = event.events[i]
        if(!subEvent.id) subEvent.id = event.id + "." + i
        handledEvents.push(...(await this.handleEvent(subEvent, mainEvent)))
      }
      return handledEvents
    }
    if (this.config.filter && !this.config.filter(event)) return []
    let done = false
    let retry = 0
    const maxRetry = this.config.maxRetryCount || 10
    while(!done && maxRetry) {
      try {
        await this.doHandleEvent(event, mainEvent)
        done = true
      } catch(e) {
        if(e == 'timeout' && retry < maxRetry) {
          retry++
          const sleepTime = Math.pow(2, retry) * 100
          console.error(`Event \n${JSON.stringify(event, null, "  ")}\n handling timeout, will retry `,
            retry, ' time after ', sleepTime, 'ms sleep')
          sleep(retry)
        } else {
          console.error(`EVENT \n${JSON.stringify(event, null, "  ")}\n HANDLING ERROR`, e, ' => STOPPING!')
          this.dispose()
          throw e
        }
      }
    }
    return [event]
  }
  async doHandleEvent(event, mainEvent) {
    let handled = false
    let eventHandlers = this.eventTypeHandlers.get(event.type) || []
    for (let handler of eventHandlers) {
      const result = await handler(event, mainEvent)
      if (result != 'ignored')
        handled = true
    }
    for (let handler of this.allEventHandlers) {
      const result = await handler(event, mainEvent)
      if (result != 'ignored')
        handled = true
    }
    if (!handled) {
      throw new Error("notHandled")
    }
  }

  savePosition() {
    if(!this.state || this.lastSavedPosition == this.state.position) return
    if(this.savePromise) return
    const elapsed = Date.now() - this.lastPositionSave
    const throttle = this.saveThrottleMs()
    if(elapsed < throttle) {
      this.scheduleSave(throttle - elapsed)
      return
    }
    this.ensureSave()
  }

  addAllEventsHandler(handler) {
    this.allEventHandlers.push(handler)
  }
  addEventHandler(eventType, handler) {
    let handlers = this.eventTypeHandlers.get(eventType)
    if(!handlers) {
      handlers = []
      this.eventTypeHandlers.set(eventType, handlers)
    }
    handlers.push(handler)
  }
}

export default EventSourcing
