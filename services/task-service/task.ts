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

async function createOrReuseTask(taskDefinition, props, causeType, cause) {
  const propertiesJson = JSON.stringify(props)
  const hash = crypto
    .createHash('sha256')
    .update(taskDefinition.name + ':' + propertiesJson)
    .digest('hex')

  const similarTasks = await app.serviceViewGet('task', 'tasksByCauseAndHash', {
    causeType,
    cause,
    hash
  })
  const oldTask = similarTasks.find(similarTask => similarTask.name === taskDefinition.name
    && JSON.stringify(similarTask.properties) === propertiesJson)

  const taskObject = oldTask
    ? await app.serviceViewGet('task', 'task', { task: oldTask.to || oldTask.id })
    : {
      id: app.generateUid(),
      name: taskDefinition.name,
      properties: props,
      hash,
      state: 'created',
      retries: [],
      maxRetries: taskDefinition.maxRetries ?? 5
    }

  if(!oldTask) {
    /// app.emitEvents
    await app.triggerService({ service: 'task', type: 'task_createCauseOwnedTask' }, {
      ...taskObject,
      causeType,
      cause,
      task: taskObject.id
    })
    await triggerOnTaskStateChange(taskObject, causeType, cause)
  }
  return taskObject
}

async function startTask(taskFunction, props, causeType, cause){
  const taskObject = await createOrReuseTask(taskFunction.definition, props, causeType, cause)
  const context = {
    causeType,
    cause,
    taskObject,
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
}

type TaskFunction = (props, context: TaskExecuteContext, emit, reportProgress) => Promise<any>

export default function task(definition:TaskDefinition, serviceDefinition) {
  if(!definition) throw new Error('Task definition is not defined')
  if(!serviceDefinition) throw new Error('Service definition is not defined')
  const taskFunction = async (props, context,
                              emit = events => app.emitEvents(definition.name, Array.isArray(events) ? events : [events], {}),
                              reportProgress = (current, total, selfProgress) => {}) => {
    if(!emit) emit = (events) =>
      app.emitEvents(definition.name, Array.isArray(events) ? events : [events], {})

    let taskObject = context.taskObject
      ?? await createOrReuseTask(definition, props, context.causeType, context.cause)

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
        const result = await app.triggerService({ service: 'task', type: 'task_updateCauseOwnedTask' }, {
          ...data,
          causeType: context.causeType,
          cause: context.cause,
          task: taskObject.id
        })

        taskObject = await app.serviceViewGet('task', 'task', { task: taskObject.id })
        //console.log("UPDATED TASK", taskObject, result)
      })
    }

    let selfProgress = { current: 0, total: 0, action: undefined }
    const subtasksProgress = []
    let progressUpdateTimer, lastProgressUpdate = 0
    const progressThrottleTime = 400
    function updateProgress() {
      if(progressUpdateTimer) clearTimeout(progressUpdateTimer)
      const current = selfProgress.current + subtasksProgress.reduce(
        (sum, progress) => sum + progress.current * (progress.factor ?? 1), 0)
      const total = selfProgress.total + subtasksProgress.reduce(
        (sum, progress) => sum + progress.total * (progress.factor ?? 1), 0)
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
      const runContext = {
        ...context,
        task: {
          id: taskObject.id,
          async run(taskFunction: TaskFunction, props, progressFactor = 1) {
            if(typeof taskFunction !== 'function') {
              console.log("TASK FUNCTION", taskFunction)
              throw new Error('Task function is not a function')
            }
            //console.log("SUBTASK RUN", taskFunction.definition.name, props)
            const subtaskProgress = { current: 0, total: 1, factor: progressFactor }
            subtasksProgress.push(subtaskProgress)
            const result = await taskFunction(
              props,
              {
                ...context,
                taskObject: undefined,
                task: taskObject.id,
                causeType: 'task_Task',
                cause: taskObject.id
              },
              (events) => app.emitEvents(definition.name,
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
          },
          async progress(current, total, action, opts) {
            selfProgress = {
              ...opts,
              current, total, action
            }
            updateProgress()
          }
        },
        async trigger(trigger, props) {
          return await app.trigger({
            causeType: 'task_Task',
            cause: taskObject.id,
            ...trigger,
          }, props)
        },
        async triggerService(trigger, props, returnArray = false) {
          return await app.triggerService({
            causeType: 'task_Task',
            cause: taskObject.id,
            ...trigger
          }, props, returnArray)
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
        console.error("TASK ERROR", error.message, error.stack)
        /*console.log("RETRIES", taskObject.retries?.length, maxRetries)*/
        if((taskObject.retries?.length || 0) >= taskObject.maxRetries - 1) {
          await updateTask({
            state: 'failed',
            doneAt: new Date(),
            error: /*error.stack ??*/ error.message ?? error,
            retries: [...(taskObject.retries || []), {
              startedAt: taskObject.startedAt,
              failedAt: new Date(),
              error: /*error.stack ??*/ error.message ?? error
            }]
          })
          console.error("TASK", taskObject.id, "OF TYPE", definition.name,
            "WITH PARAMETERS", props, "FAILED WITH ERROR", error.stack ?? error.message ?? error)
          if(definition.fallback) {
            if(typeof definition.fallback !== 'function') return definition.fallback
            return await definition.fallback(props, runContext, error.message ?? error)
          } else {
            throw error
          }
        } else {
          const retriesCount = (taskObject.retries || []).length
          await updateTask({
            state: 'retrying',
            retries: [...(taskObject.retries || []), {
              startedAt: taskObject.startedAt,
              failedAt: new Date(),
              error:/* error.stack ?? */error.message ?? error
            }]
          })
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retriesCount)))
        }
        await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
      } finally {
        if(definition.cleanup) {
          await definition.cleanup(props, runContext)
        }
      }
    }

    while(taskObject.state !== 'done' && taskObject.state !== 'failed') {
      await runTask()
     // console.log("TASK", definition.name, "AFTER RUNTASK", taskObject)
    }

    return taskObject.result
  }

  serviceDefinition.beforeStart(async () => {
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

  taskFunction.definition = definition
  taskFunction.start = async (props, causeType, cause) => {
    return await startTask(taskFunction, props, causeType, cause)
  }
  return taskFunction

}
