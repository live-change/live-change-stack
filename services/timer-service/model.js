import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

export const Timer = definition.model({
  name: "Timer",
  properties: {
    timestamp: {
      type: Number
    },
    time: {
      type: Date,
    },
    loops: {
      type: Number
    },
    interval: {
      type: Number
    },
    maxRetries: {
      type: Number
    },
    retryDelay: {
      type: Number
    },
    retries: {
      type: Number
    },
    service: {
      type: String
    },
    command: {
      type: Object
    },
    trigger: {
      type: Object
    },
    origin: {
      type: Object
    },
    causeType: {
      type: String
    },
    cause: {
      type: String
    },
    createdAt: {
      type: Date,
      default: () => new Date()
    }
  },
  indexes: {
    timestamp: {
      property: 'timestamp',
      function: async function(input, output) {
        const mapper = (obj) => ({ id: (''+obj.timestamp).padStart(16, '0') + '_' + obj.id, to: obj.id })
        await input.table('timer_Timer').onChange(
            (obj, oldObj) => output.change(obj && mapper(obj), oldObj && mapper(oldObj))
        )
      }
    }
  }
})


definition.event({
  queuedBy: 'timer',
  name: "timerCreated",
  async execute({ timer, data, origin }) {
    return Timer.create({
      id: timer,
      ...data,
      origin: { ...origin, ...( data.origin || {} ) }
    })
  }
})

definition.event({
  queuedBy: 'timer',
  name: "timerCanceled",
  async execute({ timer }) {
    return Timer.delete(timer)
  }
})

definition.event({
  queuedBy: 'timer',
  name: "timerFinished",
  async execute({ timer }) {
    return Timer.delete(timer)
  }
})

definition.event({
  queuedBy: 'timer',
  name: "timerFired",
  async execute({ timer, timestamp, loops }) {
    return Timer.update(timer, {
      loops, timestamp
    })
  }
})

definition.event({
  queuedBy: 'timer',
  name: "timerFailed",
  async execute({ timer, timestamp, retries }) {
    return Timer.update(timer, {
      retries, timestamp
    })
  }
})
