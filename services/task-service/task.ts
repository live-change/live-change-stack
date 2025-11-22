import App from '@live-change/framework'
// @ts-ignore:next-line
const app = App.app()

import * as crypto from 'crypto'

import PQueue from 'p-queue'

function upperFirst(string) {
  return string[0].toUpperCase() + string.slice(1)
}

async function triggerOnTaskStateChange(taskObject, causeType, cause) {
  if(!taskObject?.state) throw new Error('Task object state is not defined in ' + taskObject)
  if(!taskObject?.id) throw new Error('Task object id is not defined in '+taskObject)
  await app.trigger({ type: 'task'+upperFirst(taskObject.state), }, {
    ...taskObject,
    task: taskObject.id,
    causeType,
    cause
  })
  await app.trigger({ type: 'task'+upperFirst(taskObject.name)+upperFirst(taskObject.state) }, {
    ...taskObject,
    task: taskObject.id,
    causeType,
    cause
  })
  await app.trigger({
    type: `${taskObject.causeType}_${taskObject.cause}OwnedTask`
           +`${upperFirst(taskObject.name)}${upperFirst(taskObject.state)}`
  }, {
    ...taskObject,
    task: taskObject.id,
    causeType,
    cause
  })
}

interface ClientInfo {
    user?: string
    session?: string
}

async function createOrReuseTask(taskDefinition, props, causeType, cause, expire, client:ClientInfo) {  
  const propertiesJson = JSON.stringify(props)
  const userInfo = client?.user ? `user:${client.user}` : `session:${client?.session}`
  const hash = crypto
    .createHash('sha256')
    .update(taskDefinition.name + ':' + propertiesJson + userInfo)    
    .digest('hex')

  const expireDate = (expire ?? taskDefinition.expire) ? new Date(Date.now() - taskDefinition.expire) : null

  const similarTasks = await app.serviceViewGet('task', 'tasksByCauseAndHash', {
    causeType,
    cause,
    hash,
    expireDate
  })

  const oldTask = similarTasks.find(similarTask => similarTask.name === taskDefinition.name
    && JSON.stringify(similarTask.properties) === propertiesJson 
    && (!expireDate || (new Date(similarTask.startedAt).getTime() > expireDate.getTime())))

  const taskObject = oldTask
    ? await app.serviceViewGet('task', 'task', { task: oldTask.to || oldTask.id })
    : {
      id: app.generateUid(),
      name: taskDefinition.name,
      properties: props,
      hash,
      state: 'created',
      service: taskDefinition.service,
      retries: [],
      maxRetries: taskDefinition.maxRetries ?? 5,
      client
    }

  if(!oldTask) {
    /// app.emitEvents
    await app.triggerService({ service: 'task', type: 'task_createTask' }, {
      ...taskObject,
      causeType,
      cause,
      task: taskObject.id
    })
    await triggerOnTaskStateChange(taskObject, causeType, cause)
  }
  return taskObject
}


async function startTask(taskFunction, props, causeType, cause, expire, client:ClientInfo){
  const taskObject = await createOrReuseTask(taskFunction.definition, props, causeType, cause, expire, client)
  const context = {
    causeType,
    cause,
    taskObject,
    client
  }
  console.log("START TASK!", taskFunction.name)
  const promise = taskFunction(props, context)
  return { task: taskObject.id, taskObject, promise, causeType, cause }
}

interface TaskExecuteApi {
  id: string,
  run: (taskFunction, props, progressFactor) => Promise<any>,
  progress: (current, total, action, opts) => void,
  trigger: (trigger, props) => Promise<any>,
  triggerService: (trigger, props, returnArray) => Promise<any>
}

interface TaskExecuteContext {
  task: TaskExecuteApi,
  trigger: (trigger, props) => Promise<any>,
  triggerService: (trigger, props, returnArray) => Promise<any>,
  causeType: string,
  cause: string
}

interface TaskDefinition {
  /**
   * Task name
   */
  name: string,

  /**
   * Maximum number of retries
   */
  maxRetries?: number,

  /**
   * Retry delay in milliseconds as function of retry count
   */
  retryDelay?: (retryCount: number) => number,   // default is 1000 * Math.pow(2, retryCount)

  /**
   * Task properties/parameters schema
   */
  properties?: Object,

  /**
   * Task returns schema
   */
  returns?: Object,

  /**
   * Task expiration time in milliseconds
   */
  expire?: number,

  /**
   * Task execution function
   * @param props - task properties/parameters
   * @param context - task context
   * @param emit - event emitter function
   * @returns {Promise<any>} - task result promise
   */
  execute: (props, context: TaskExecuteContext, emit) => Promise<any>,

  /**
   * Cleanup function
   * @param props - task properties/parameters
   * @param context - task context
   * @returns {Promise<void>} - cleanup result promise
   */
  cleanup?: (props, context: TaskExecuteContext) => Promise<void>,

  /**
   * Fallback function
   * @param props - task properties/parameters
   * @param context - task context
   * @param error - error object
   * @returns {Promise<any>} - fallback result
   */
  fallback?: (props, context: TaskExecuteContext, error) => any

  /**
   * create trigger for task, trigger will return object with task property
   * @param trigger - true, or trigger name
   */
  trigger?: string | true

  /**
   * create action for task, action will return object with task property,
   * @param action - true, or action name
   */
  action?: { name: string } // TODO: create ActionDefinition type

  /**
   * Task service name
   */
  service?: string

}

function progressCounter(reportProgress) {  
  let currentAcc = 0
  let totalAcc = 0
  const progressFunction = (current, total, action, opts) => {
    currentAcc = current
    totalAcc = total
    return reportProgress(currentAcc, totalAcc, action, opts)
  }
  progressFunction.increment = (action, by = 1, opts) => {
    currentAcc += by
    return progressFunction(currentAcc, totalAcc, action, opts)
  }
  progressFunction.incrementTotal = (action, by = 1, opts) => {
    totalAcc += by
    return progressFunction(currentAcc, totalAcc, action, opts)
  }
  progressFunction.action = (action, opts) => {
    return progressFunction(currentAcc, totalAcc, action, opts)
  }
  progressFunction.done = (opts) => {
    return progressFunction(totalAcc, totalAcc, undefined, opts)
  }
  progressFunction.slice = (sliceSize, factor = 1.0) => {
    const sliceStart = currentAcc    
    const sliceEnd = sliceStart + sliceSize
    currentAcc = sliceEnd
    return progressCounter((current, total, action, opts) => {
      return progressFunction(sliceStart + Math.min(current, sliceSize) * factor,
         sliceEnd + Math.min(total, sliceSize) * factor, action, opts)
    })
  }
  return progressFunction
}

type TaskFunction = (props, context: TaskExecuteContext, emit, reportProgress) => Promise<any>

export default function task(definition:TaskDefinition, serviceDefinition) {
  if(!definition) throw new Error('Task definition is not defined')
  if(!serviceDefinition) throw new Error('Service definition is not defined')
  definition.service = serviceDefinition.name
  const taskFunction = async (props, context,
                              emit = events => app.emitEvents(definition.name, Array.isArray(events) ? events : [events], {}),
                              reportProgress = (current, total, selfProgress) => {}) => {
    if(!emit) {
      emit = (events) =>
        app.emitEvents(serviceDefinition.name, Array.isArray(events) ? events : [events], {})
    }

    let taskObject = context.taskObject ?? 
      await createOrReuseTask(definition, props, context.causeType, context.cause, context.expire, context.client)

    if(!taskObject?.state) throw new Error('Task object state is not defined in ' + taskObject)
    if(!taskObject?.id) throw new Error('Task object id is not defined in '+taskObject)

    const updateQueue = new PQueue({ concurrency: 1 })

    async function updateTask(data) {
      if(typeof data !== 'object') throw new Error('Task update data is not an object' + JSON.stringify(data))
      if(!taskObject?.state) throw new Error('Task object state is not defined in ' + JSON.stringify(taskObject))
      if(!taskObject?.id) throw new Error('Task object id is not defined in ' + JSON.stringify(taskObject))
/*      console.log("UPDATING TASK", {
        ...data,
        type: 'task_updateCauseOwnedTask',
        causeType: context.causeType,
        cause: context.cause,
        task: taskObject.id
      })
      console.trace("UPDATING TASK!")*/
      await updateQueue.add(async () => {
        const result = await app.triggerService({ service: 'task', type: 'task_updateTask' }, {
          ...data,
          causeType: context.causeType,
          cause: context.cause,
          task: taskObject.id
        })

        taskObject = await app.serviceViewGet('task', 'task', { task: taskObject.id })
        console.log("UPDATED TASK", taskObject, result)
      })
    }

    let selfProgress = { current: 0, total: 0, action: undefined }
    const subtasksProgress: { current: number, total: number, factor: number }[] = []
    let progressUpdateTimer, lastProgressUpdate = 0
    const progressThrottleTime = 400
    function updateProgress() {
      if(progressUpdateTimer) clearTimeout(progressUpdateTimer)
      const current = selfProgress.current + subtasksProgress.reduce(
        (sum, progress: { current: number, total: number, factor: number }) => 
          sum + progress.current * (progress.factor ?? 1), 0)
      const total = selfProgress.total + subtasksProgress.reduce(
        (sum, progress: { current: number, total: number, factor: number }) => 
          sum + progress.total * (progress.factor ?? 1), 0)
      reportProgress(current, total, selfProgress.action)

      if(lastProgressUpdate + progressThrottleTime > Date.now()) { // ignore this update, do it later
        setTimeout(updateProgress, progressThrottleTime - lastProgressUpdate - Date.now())
        return
      }
      console.log("UPDATE", definition.name, "PROGRESS", current, total, selfProgress, subtasksProgress)
      updateTask({
        progress: { ...selfProgress, current, total }
      })
    }

    const runTask = async () => {
      await updateTask({
        state: 'running',
        startedAt: new Date()
      })
      await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
      const commonFunctions = {
        async run(taskFunction: TaskFunction, props, progressFactor = 1, expire = undefined) {
          if(typeof taskFunction !== 'function') {
            console.log("TASK FUNCTION", taskFunction)
            throw new Error('Task function is not a function')
          }
          //console.log("SUBTASK RUN", taskFunction.definition.name, props)
          const subtaskProgress = { current: 0, total: 1, factor: progressFactor }
          subtasksProgress.push(subtaskProgress)
          try {
            const result = await taskFunction(
              props,
              {
                ...context,
                taskObject: undefined,
                causeType: 'task_Task',
                cause: taskObject.id,
                expire
              },
              (events) => app.emitEvents(serviceDefinition.name,
                Array.isArray(events) ? events : [events], {}),
              (current, total, action) => {
                subtaskProgress.current = current
                subtaskProgress.total = total
                updateProgress()
              }
            )
            //console.log("SUBTASK DONE", taskFunction.definition.name, props, '=>', result)
            subtaskProgress.current = subtaskProgress.total
            updateProgress()
            return result
          } catch(error) {
            subtaskProgress.current = subtaskProgress.total // failed = finished
            const outputError: any = new Error("Subtask error: " + error.toString())
            outputError.stack = error.stack
            outputError.taskNoRetry = true
            throw outputError
          }
        },
        progress: progressCounter((current, total, action, opts) => { // throttle this
          selfProgress = {
            ...opts,
            current, total, action
          }
          updateProgress()
        })
      }
      const runContext = {
        ...context,
        task: {
          id: taskObject.id,
          ...commonFunctions
        },      
        ...commonFunctions,
        async trigger(trigger, props) {
          return await app.trigger({
            causeType: 'task_Task',
            cause: taskObject.id,
            client: context.client,
            ...trigger,
          }, props)
        },
        async triggerService(trigger, props, returnArray = false) {
          return await app.triggerService({
            causeType: 'task_Task',
            cause: taskObject.id,
            client: context.client,
            ...trigger
          }, props, returnArray)
        },
        async triggerTask(trigger, data, progressFactor = 1) {
          const tasks = await app.trigger({
            causeType: 'task_Task',
            cause: taskObject.id,
            client: context.client,
            ...trigger
          }, data)
          const fullProgressSum = tasks.length * progressFactor     
          const task = this     
          const taskWatchers = tasks.map(task => {
            const observable = Task.observable(task)
            if(!observable) {
              console.error("SUBTASK OBSERVABLE NOT FOUND", task)
              throw new Error("SUBTASK OBSERVABLE NOT FOUND")
            }
            const watcher: any = {          
              observable,
              observer(signal, value) {
                if(signal !== 'set') return
                if(value) {                
                  if(value.progress) {
                    watcher.progress = value.progress
                    updateProgress()
                  }
                  if(value.state === 'done') {              
                    watcher.resolve(value.result)
                  } else if(value.state === 'failed') {
                    watcher.reject(value)
                  }
                }
              },
              progress: {
                current: 0,
                total: 1,
                factor: progressFactor/tasks.length
              },
              run(resolve, reject) { 
                watcher.resolve = resolve
                watcher.reject = reject
                //console.log("SUBTASK WATCHER", watcher, "TASK OBSERVABLE", watcher.observable)
                subtasksProgress.push(watcher.progress)
                watcher.observable.observe(watcher.observer)                              
              }
            }
            return watcher
          })          
          
          const promises = taskWatchers.map(watcher => new Promise((resolve, reject) => watcher.run(resolve, reject)))
          try {
            await Promise.all(promises)
            //console.log("TASK WATCHERS PROMISES FULLFILLED", taskWatchers)
            const results = taskWatchers.map(watcher => {
              //console.log("WATCHER OBSERVABLE", watcher.observable)
              return watcher.observable.getValue().result
            })
            return results
          } catch(subtask) {
            const retry = subtask.retries?.at(-1)
            const outputError: any = new Error("Subtask error: " + retry?.error)
            outputError.stack = retry?.stack
            outputError.taskNoRetry = true
            throw outputError
          }                    
        }
      }
      try {
        const result = await definition.execute(props, runContext, emit)
        await updateTask({
          state: 'done',
          doneAt: new Date(),
          result
        })
        await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
      } catch(error) {
        if((taskObject.retries?.length || 0) >= taskObject.maxRetries - 1 || error.taskNoRetry) {
          await updateTask({
            state: (definition.fallback && !error.taskNoFallback) ? 'fallback' : 'failed',
            doneAt: new Date(),
            error: /*error.stack ??*/ error.message ?? error,
            retries: [...(taskObject.retries || []), {
              startedAt: taskObject.startedAt,
              failedAt: new Date(),
              error: /*error.stack ??*/ error.message ?? error,
              stack: error.stack
            }]
          })
          console.error("TASK", taskObject.id, "OF TYPE", definition.name,
            "WITH PARAMETERS", props, "FAILED WITH ERROR", error.stack ?? error.message ?? error)
          if(definition.fallback && !error.taskNoFallback) {
            await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
            let result
            if(typeof definition.fallback !== 'function') {
              result = definition.fallback
            } else {
              result = definition.fallback(props, runContext, error.message ?? error)
            }
            await updateTask({
              state: 'fallbackDone',
              result
            })
          } else {
            await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
            throw error
          }
        } else {
          const retriesCount = (taskObject.retries || []).length
          await updateTask({
            state: 'retrying',
            retries: [...(taskObject.retries || []), {
              startedAt: taskObject.startedAt,
              failedAt: new Date(),
              error: error.message ?? error,
              stack: error.stack
            }]
          })
          const retryDelay = definition.retryDelay ? definition.retryDelay(retriesCount) : 1000 * Math.pow(2, retriesCount)
          console.log("RETRYING TASK", taskObject.id, "IN", retryDelay, "ms")   
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
        await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
      } finally {
        if(definition.cleanup) {
          await definition.cleanup(props, runContext)
        }
      }
    }

    if(taskObject.state === 'failed') {
      throw new Error(taskObject.retries[taskObject.retries.length - 1].error)
    }
    
    while(taskObject.state !== 'done' && taskObject.state !== 'fallbackDone' && taskObject.state !== 'failed') {
      console.log("RUNNING TASK", definition.name, "STATE", taskObject.state, "OBJECT", taskObject)
      await runTask()
      console.log("TASK", definition.name, "AFTER RUNTASK", taskObject)
     // console.log("TASK", definition.name, "AFTER RUNTASK", taskObject)
    }

    return taskObject.result
  }

  serviceDefinition.tasks = serviceDefinition.tasks || {}
  serviceDefinition.tasks[definition.name] = definition

  serviceDefinition.afterStart(async () => {
    setTimeout(async () => {
      let gt = undefined
      let tasksToRestart = await app.viewGet('runningTaskRootsByName', {
        name: definition.name,
        gt,
        limit: 25
      })
      while(tasksToRestart.length > 0) {
        console.log("FOUND", tasksToRestart.length, "TASKS", definition.name, "TO RESTART")
        for(const task of tasksToRestart) {
          console.log("RESTARTING TASK", task)
          const taskObject = { ...task, id: task.to ?? task.id }
          const context = {
            causeType: task.causeType,
            cause: task.cause,
            taskObject,
            client: task.client
          }
          /// mark started subtasks as interrupted
          const subtasks = await app.serviceViewGet('task', 'tasksByRoot', {
            rootType: 'task_Task',
            root: taskObject.to ?? taskObject.id
          })
          console.log("SUBTASKS", subtasks)
          for(const subtask of subtasks) {
            if(subtask.state === 'running' && (subtask.to ?? subtask.id) !== (taskObject.to ?? taskObject.id)) {         
              await app.triggerService({ service: 'task', type: 'task_updateTask' }, {
                task: subtask.to ?? subtask.id,
                causeType: subtask.causeType,
                cause: subtask.cause,
                state: 'interrupted'
              })
            }
          }          
          const promise = taskFunction(taskObject.properties, context)
          /// run async = ignore promise
          await new Promise(resolve => setTimeout(resolve, 1000)) // wait a second
        }
        gt = tasksToRestart[tasksToRestart.length - 1].id
        console.log("GT", gt)
        tasksToRestart = await app.viewGet('runningTaskRootsByName', {
          name: definition.name,
          gt,
          limit: 25
        })
      }
    }, 500)
  })

  const Task = serviceDefinition.foreignModel('task', 'Task')


  if(definition.trigger) {
    serviceDefinition.trigger({
      name: definition.trigger === true ? definition.name : definition.trigger,
      properties: definition.properties,
      returnsTask: definition.name,
      returns: {
        type: Task
      },
      async execute(props, context, emit) {
        const startResult =
          await startTask(taskFunction, props,            
            context.reaction.causeType ?? 'trigger', 
            context.reaction.cause ?? context.reaction.id, 
            props.taskExpire, context.client) // Must be done that way, so subtasks can be connected to the parent task
        return startResult.task
      }
    })
  } else {  
    serviceDefinition.trigger({
      name: 'runTask_'+serviceDefinition.name+'_'+definition.name,
      properties: definition.properties,
      returnsTask: definition.name,
      returns: {
        type: Task
      },
      async execute(props, context, emit) {
        const startResult =
          await startTask(taskFunction, 
            props,
            context.reaction.causeType ?? 'trigger', 
            context.reaction.cause ?? context.reaction.id, 
            props.taskExpire, context.client) // Must be done that way, so subtasks can be connected to the parent task
        return startResult.task
      }
    })  
  }

  if(definition.action) {    
    const name = definition.action.name || definition.name    
    serviceDefinition.action({
      name,
      properties: definition.properties,
      returnsTask: definition.name,
      returns: {
        type: Task
      },
      async execute(props, context, emit) {
        const startResult =
          await startTask(taskFunction, props, 'command', context.command.id, undefined, context.client)
        return startResult.task
      },
      ...(typeof definition.action === 'object' && definition.action)
    })

  }

  taskFunction.definition = definition
  taskFunction.start = async (props, causeType, cause, expire = undefined, client:ClientInfo) => {
    return await startTask(taskFunction, props, causeType, cause, expire, client)
  }
  return taskFunction

}
