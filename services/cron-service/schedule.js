import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'
import { triggerType } from './run.js'

export const Schedule = definition.model({
  name: "Schedule",
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
    readAllAccess: ['admin'],
  },
  properties: {
    description: {
      type: String
    },
    minute: {
      type: Number // NaN for every minute      
    },
    hour: {
      type: Number, // NaN for every hour      
    },
    day: {
      type: Number, // NaN for every day      
    },
    dayOfWeek: {
      type: Number, // NaN for every day of week      
    },
    month: {
      type: Number, // NaN for every month      
    },
    trigger: triggerType
  }
})

function getNextTime(schedule) {
  const now = new Date()
  let time = now
  if(Number.isInteger(schedule.minute)) {
    if(time.getMinutes() >= schedule.minute) { // next hour
      time = new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours() + 1, schedule.minute, 0)
    } else {
      time = new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours(), schedule.minute, 0)
    }
  }
  if(Number.isInteger(schedule.hour)) {
    if(time.getHours() > schedule.hour) { // next day
      time = new Date(time.getFullYear(), time.getMonth(), time.getDate() + 1, schedule.hour, schedule.minute || 0, 0)
    } else {
      time = new Date(time.getFullYear(), time.getMonth(), time.getDate(), schedule.hour, schedule.minute || 0, 0)
    }
  }

  function isDayOk() {
    if(Number.isInteger(schedule.month) && time.getMonth()+1 !== schedule.month) return false
    if(Number.isInteger(schedule.day) && time.getDate() !== schedule.day) return false
    if(Number.isInteger(schedule.dayOfWeek) && time.getDay()+1 !== schedule.dayOfWeek) return false        
    return true
  }
  while(!isDayOk()) {
    time = new Date(time.getTime() + 24 * 60 * 60 * 1000)
  }
  return time
}

async function processSchedule({ id, minute, hour, day, dayOfWeek, month, trigger }) {
  const nextTime = getNextTime(schedule)
  const nextTimestamp = nextTime.getTime()
  await triggerService({
    service: 'timer',
    type: 'createTimer',
  }, {
    timer: {
      id: 'cron_Schedule_' + id,
      timestamp: nextTimestamp,
      time: nextTime,      
      service: definition.name,
      causeType: 'cron_Schedule',
      cause: id,
      trigger: {
        type: 'runSchedule',
        data: {
          schedule: id
        }
      }
    }
  })
}

definition.trigger({
  name: 'runSchedule',
  properties: {
    schedule: {
      type: Schedule,
    }
  },
  execute: async ({ schedule }, { service, trigger, triggerService }, emit) => {
    const scheduleData = await Schedule.get(schedule)
    if(!scheduleData) return /// schedule was deleted
    await processSchedule(scheduleData) // no wait, process immediately
    try {
      await doRunTrigger(scheduleData.trigger, {
        trigger,
        triggerService,
        jobType: 'cron_Schedule',
        job: schedule
      })
    } catch(error) {
      console.error("ERROR RUNNING SCHEDULE TRIGGER", error)
    }
    
  }
})

definition.trigger({
  name: 'changeCron_Schedule',
  properties: {
    object: {
      type: Schedule,
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
    if(oldData) {
      await triggerService({
        service: 'timer',
        type: 'cancelTimerIfExists',
        data: {
          timer: 'cron_Schedule_' + object.id
        }
      })
    }
    if(data) {
      await processSchedule({
        id: object,
        ...data
      })
    }
  }
})

const Timer = definition.foreignModel('timer', 'Timer')

definition.afterStart(async (service) => {
  const position = ''
  const bucketSize = 128
  let bucket = []
  do {
    bucket = await Schedule.rangeGet({
      gt: position,
      limit: bucketSize
    })
  } while(bucket.length === bucketSize)
  for(const schedule of bucket) {
    const existingTimer = await Timer.get('cron_Schedule_' + schedule.id)
    if(!existingTimer) {
      console.error("SCHEDULE", schedule, "HAS NO TIMER, REPROCESSING")
      await processSchedule(schedule)
    }
  }
})