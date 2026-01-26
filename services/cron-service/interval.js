import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'
import { triggerType, runTrigger, doRunTrigger, RunState } from './run.js'
import createWaitingFunction from './waitForDone.js'

const waitForTasks = createWaitingFunction(definition)

function intervalAccessControlObjects({ ownerType, owner, topicType, topic }) {
  return [{
    objectType: ownerType,
    object: owner
  }]
}

export const Interval = definition.model({
  name: "Interval",
  propertyOfAny: {
    to: ['owner', 'topic'],
    ownerTypes: config.ownerTypes,
    topicTypes: config.topicTypes,
    writeAccessControl: {
      roles: config.adminRoles,
      objects: intervalAccessControlObjects
    },
    readAccessControl: {
      roles: [...config.adminRoles, ...config.readerRoles],
      objects: intervalAccessControlObjects
    },
    readAllAccess: ['admin'],
  },
  properties: {
    description: {
      type: String,
      description: "Description of the interval",
      input: 'textarea',
    },
    interval: {
      type: Number, // milliseconds      
      description: "Interval between triggers in milliseconds",
      validation: ['nonEmpty', 'integer'],
      input: 'integer',
      inputConfig: {
        attributes: {
          suffix: ' ms',
          showButtons: true,
          step: 1000,
          min: 1000,
        }
      }
    },
    firstRunDelay: {
      type: Number, // milliseconds 
      description: "Delay before first run",
      input: 'integer',
      inputConfig: {
        attributes: {
          suffix: ' ms',
          showButtons: true,
          step: 1000,
          min: 0,
        }
      }
    },
    wait: {
      type: Number, // milliseconds 
      description: "Wait for previous trigger to finish before planning next trigger",
      input: 'integer',
      inputConfig: {
        attributes: {
          suffix: ' ms',
          showButtons: true,
          step: 1000,
          min: 0,
        }
      }
    },
    trigger: triggerType
  }
})

export const IntervalInfo = definition.model({
  name: "IntervalInfo",
  propertyOf: {
    what: Interval,
    readAccessControl: {
      roles: [...config.adminRoles, ...config.readerRoles]
    }
  },
  properties: {
    lastRun: {
      type: Date
    },
    nextRun: {
      type: Date
    }
  }
})

async function processInterval({ id, interval, wait, trigger, firstRunDelay, isFirstRun }, { triggerService }) {
  //console.log("PROCESSING INTERVAL", id, interval, wait, trigger, firstRunDelay, isFirstRun)
  if(wait) await waitForTasks('cron_Interval', id, { triggerService })
  //console.log("WAIT FOR TASKS DONE", id)
  const nextTimestamp = Date.now() + (isFirstRun ? (firstRunDelay || 0) : interval)
  const nextTime = new Date(nextTimestamp)
  //console.log("NEXT TIME", nextTime)
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
  await IntervalInfo.update(id, {
    id,    
    nextRun: nextTime
  })
  //console.log("TIMER CREATED", id)
}


definition.trigger({
  name: 'runInterval',
  properties: {
    interval: {
      type: Interval,
    }
  },
  execute: async ({ interval }, { service, trigger, triggerService }, emit) => {
    const intervalData = await Interval.get(interval)
    if(!intervalData) return /// interval was deleted
    if(intervalData.wait) {
      const lastRun = new Date()
      await runTrigger(intervalData.trigger, {
        trigger,
        triggerService,
        jobType: 'cron_Interval',
        job: interval,
        timeout: Number.isInteger(intervalData.wait) ? intervalData.wait : undefined,
        runTime: lastRun
      })
      await IntervalInfo.update(interval, {
        id: interval,
        lastRun       
      })
      await processInterval(intervalData, { triggerService })
    } else {
      await processInterval(intervalData, { triggerService }) // no wait, process immediately
      try {
        const lastRun = new Date()
        await doRunTrigger(intervalData.trigger, {
          trigger,
          triggerService,
          jobType: 'cron_Interval',
          job: interval,
          runTime: lastRun
        })
        await IntervalInfo.update(interval, {
          id: interval,
          lastRun
        })
      } catch(error) {
        console.error("ERROR RUNNING INTERVAL TRIGGER", error)
      }
    }
  }
})


definition.trigger({
  name: 'changeCron_Interval',
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
      }, {
        timer: 'cron_Interval_' + object
      })
      if(!data) { // full cleanup
        await triggerService({
          service: 'timer',
          type: 'cancelTimerIfExists',          
        }, {
          timer: 'cron_run_timeout_' + object
        })
        RunState.delete(App.encodeIdentifier(['cron_Interval', object]))
      }
    }
    if(data) { // setup new version
      console.log("PROCESSING INTERVAL", object, data)
      await processInterval({
          id: object,
          ...data,
          isFirstRun: !oldData
        }, { triggerService })
      console.log("PROCESSING INTERVAL DONE", object, data)
    }
  }
})

const Timer = definition.foreignModel('timer', 'Timer')

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
        await processInterval(interval, { 
          triggerService: (trigger, data, returnArray = false) => 
            app.triggerService({ 
              ...trigger,
              causeType: 'cron_Interval',
              cause: 'cron_Interval_' + interval.id,
            }, data, returnArray) 
        })
      }
    }    
  } while(bucket.length === bucketSize)    
})
