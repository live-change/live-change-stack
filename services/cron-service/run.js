import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

const Task = definition.foreignModel('task', 'Task')
import config from './config.js'

export const RunState = definition.model({
  name: "RunState",
  propertyOfAny: {
    to: ['job'],
    jobTypes: ['cron_Interval', 'cron_Schedule'],
    readAccessControl: {
      roles: [...config.adminRoles, ...config.readerRoles]
    }
  },
  properties: {
    state: {
      type: String,
      enum: ['running', 'waiting']
    },
    tasks: {
      type: Array,
      of: {
        type: Task
      }
    },
    startedAt: {
      type: Date
    },
    returnTask: {
      type: Boolean
    }
  },
  indexes: {
    byTasks: {
      multi: true,
      property: ['tasks']
    }
  }
})

export const triggerType = {  
  description: "Trigger to schedule",
  input: 'trigger',
  type: Object,
  properties: {
    name: {
      description: "Trigger name",
      type: String,
      validation: ['nonEmpty']
    },
    service: {
      description: "Service holding the trigger, or null for triggering any service",
      type: String,
      validation: ['nonEmpty']
    },
    properties: {
      description: "Properties to pass to the trigger",
      type: Object,
      input: 'json',
      defaultValue: {}
    }
  }
}

export async function doRunTrigger(triggerInfo, { trigger, triggerService, jobType, job, runTime }) {
  if(triggerInfo.service) {
    return await triggerService({
      type: triggerInfo.name,
      service: triggerInfo.service,
      causeType: jobType, cause: job
    }, {
      ...triggerInfo.properties,
      jobRunTime: runTime
    }, true)
  } else {
    return await trigger({
      type: triggerInfo.name,
      causeType: jobType, cause: job
    }, {
      ...triggerInfo.properties,
      jobRunTime: runTime
    })
  }
}

export async function runTrigger(triggerInfo, { trigger, triggerService, jobType, job, timeout, runTime }) {
  const id = App.encodeIdentifier([jobType, job])
  await RunState.create({    
    id,
    jobType, job,
    startedAt: new Date(),
    state: 'running'
  })
  if(timeout) {
    const timestamp = Date.now() + timeout
    const time = new Date(timestamp)
    await triggerService({
      service: 'timer',
      type: 'createTimer'
    }, {
      timer: {
        id: 'cron_run_timeout_' + id,
        timestamp, time,
        causeType: jobType, cause: job,
        service: definition.name,
        trigger: {
          type: 'runTimeout',
          data: {
            jobType, job
          }
        }
      }
    })
  }
  let triggerResults = []
  try {
    triggerResults = await doRunTrigger(triggerInfo, { trigger, triggerService, jobType, job, runTime })
  } catch(error) {
    console.error("ERROR RUNNING TRIGGER", error)   
    /// Ignore error, it will be handled by the task service
  }
  if(triggerInfo.returnTask) {
    const tasks = await Promise.all(triggerResults.map((result) => Task.get(result)))
      .filter(task => task !== undefined)
      .filter(task => task.state !== 'done' && task.state !== 'failed')
    if(tasks.length > 0) {
      await RunState.update(id, {
        state: 'waiting',
        tasks: tasks.map(task => task.id)
      })
      /// Double check to avoid race condition
/*       const runningTasks = await Promise.all(tasks.map(task => Task.get(task.id))).filter(task => task.state !== 'done' && task.state !== 'failed')
      if(runningTasks.length === 0) {
        await RunState.delete(id)    
        return 'done'
      } */
      /// There are still running tasks, wait for them
      return 'waiting'
    }    
  }   
  await RunState.delete(id)
  if(timeout) {
    await triggerService({
      service: 'timer',
      type: 'cancelTimer'
    }, {
      timer: 'cron_run_timeout_' + id,
    })
  }
  return 'done'
}

definition.trigger({
  name: 'runTimeout',
  properties: {
    jobType: {
      type: String
    },
    job: {
      type: String
    }
  },
  execute: async ({ jobType, job }, { trigger, triggerService }) => {
    const id = App.encodeIdentifier([jobType, job])
    await RunState.delete(id)
    return 'done'
  }
})

export async function waitForTasks(jobType, job) {
  const runState = App.encodeIdentifier([jobType, job])
  return new Promise((resolve, reject) => {    
    let done = false    
    const taskObservations = new Map()
    function addTaskObservation(taskId) {
      const observable = Task.observable(taskId)
      if(!observable) return
      const observer = {
        set: (value) => {
          if(!value) return updateTasks()
          if(value.state === 'done' || value.state === 'failed') updateTasks()        
        }
      }
      taskObservations.set(taskId, { observable, observer })
      observable.observe(observer)
    }
    async function updateTasks() {
      if(done) return
      const runningTasks = taskObservations.values()
        .filter(observation => observation.observable.getValue().state !== 'done' && observation.observable.getValue().state !== 'failed')
      if(runningTasks.length === 0) {
        await RunState.delete(runState) 
        finish()
      }
    }
    const runStateObservable = RunState.observable(runState)
    const runStateObserver = {
      set: (value) => {
        if(!value) finish()
        if(value.tasks) {
          for(const taskId of value.tasks) {
            addTaskObservation(taskId)
          }
        }
      }
    }
    function finish() {
      if(done) return
      done = true
      runStateObservable.unobserve(runStateObserver)
      resolve()
    }
  })
}