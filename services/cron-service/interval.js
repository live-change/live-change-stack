import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'
import { triggerType } from './run.js'

export const Interval = definition.model({
  name: "Interval",
  propertyOfAny: {
    to: ['owner', 'topic'],
    ownerTypes: config.ownerTypes,
    topicTypes: config.topicTypes,
    writeAccessControl: {
      roles: config.adminRoles
    },
    readAccessControl: {
      roles: config.adminRoles
    },
  },
  properties: {
    description: {
      type: String,
      description: "Description of the interval"
    },
    interval: {
      type: Number, // milliseconds      
      description: "Interval between triggers in milliseconds"
    },
    wait: {
      type: Number, // milliseconds 
      description: "Wait for previous trigger to finish before planning next trigger"     
    },
    trigger: triggerType
  }
})

async function processInterval({ id, interval, wait, trigger }) {
  if(wait) await waitForTasks('cron_Interval', id)
  const nextTimestamp = Date.now() + interval
  const nextTime = new Date(nextTimestamp)
  await triggerService({
    service: 'timer',
    type: 'createTimer',
  }, {
    timer: {
      id: 'cron_Interval_' + id,
      timestamp: nextTimestamp,
      time: nextTime,      
      service: definition.name,
      causeType: 'cron_Interval',
      cause: id,
      trigger: {
        type: 'runInterval',
        data: {
          interval: id
        }
      }
    }
  })
}


definition.trigger({
  type: 'runInterval',
  properties: {
    interval: {
      type: Interval,
    }
  },
  execute: async ({ interval }, { service, trigger, triggerService }, emit) => {
    const intervalData = await Interval.get(interval)
    if(!intervalData) return /// interval was deleted
    if(intervalData.wait) {
      await runTrigger(intervalData.trigger, {
        trigger,
        triggerService,
        jobType: 'cron_Interval',
        job: interval,
        timeout: Number.isInteger(intervalData.wait) ? intervalData.wait : undefined
      })
      await processInterval(intervalData)
    } else {
      await processInterval(intervalData) // no wait, process immediately
      try {
        await doRunTrigger(intervalData.trigger, {
          trigger,
          triggerService,
          jobType: 'cron_Interval',
          job: interval
        })
      } catch(error) {
        console.error("ERROR RUNNING INTERVAL TRIGGER", error)
      }
    }
  }
})


definition.trigger({
  type: 'changeCron_Interval',
  properties: {
    object: {
      type: Interval,
      validation: ['nonEmpty'],
    },
    data: {
      type: Object,
    },
    oldData: {
      type: Object,
    }
  },
  execute: async ({ object, data, oldData }, { service, trigger, triggerService }, emit) => {    
    if(oldData) { // clear old version
      await triggerService({
        service: 'timer',
        type: 'cancelTimerIfExists',
        data: {
          timer: 'cron_Interval_' + object.id
        }
      })
      if(!data) { // full cleanup
        await triggerService({
          service: 'timer',
          type: 'cancelTimerIfExists',
          data: {
            timer: 'cron_run_timeout_' + object.id
          }
        })
        RunState.delete(App.encodeIdentifier(['cron_Interval', object.id]))
      }
    }
    if(data) { // setup new version
      await processInterval({
        id: object,
        ...data``
      })
    }
  }
})

const Timer = service.foreignModel('timer', 'Timer')

definition.afterStart(async (service) => {
  const position = ''
  const bucketSize = 128
  let bucket = []
  do {
    bucket = await Interval.rangeGet({
      gt: position,
      limit: bucketSize
    })
    for(const interval of bucket) {
      const existingTimer = await Timer.get('cron_Interval_' + interval.id)
      if(!existingTimer) {
        console.error("INTERVAL", interval, "HAS NO TIMER, REPROCESSING")
        await processInterval(interval)
      }
    }    
  } while(bucket.length === bucketSize)    
})
