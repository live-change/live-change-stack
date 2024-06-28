import App from '@live-change/framework'
const app = App.app()

import crypto from 'crypto'

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
  const promise = taskFunction(props, context)
  return { task: taskObject.id, taskObject, promise, causeType, cause }
}

export default function task(definition, serviceDefinition) {
  if(!definition) throw new Error('Task definition is not defined')
  if(!serviceDefinition) throw new Error('Service definition is not defined')
  const taskFunction = async (props, context, emit, reportProgress = () => {}) => {
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

    let selfProgress = { current: 0, total: 0 }
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
      try {
        const result = await definition.execute(props, {
          ...context,
          task: {
            id: taskObject.id,
            async run(taskFunction, props, progressFactor = 1) {
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
            return await app.triggerService(trigger, props, returnArray)
          }
        })
        await updateTask({
          state: 'done',
          doneAt: new Date(),
          result
        })
        await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
      } catch(error) {
        console.log("TASK ERROR", error.message, error.stack)
        /*console.log("RETRIES", taskObject.retries?.length, maxRetries)*/
        if((taskObject.retries?.length || 0) >= taskObject.maxRetries) {
          await updateTask({
            state: 'failed',
            doneAt: new Date(),
            error: error.stack ?? error.message ?? error,
            retries: [...(taskObject.retries || []), {
              startedAt: taskObject.startedAt,
              failedAt: new Date(),
              error: error.stack ?? error.message ?? error
            }]
          })
        } else {
          const retriesCount = (taskObject.retries || []).length
          await updateTask({
            state: 'retrying',
            retries: [...(taskObject.retries || []), {
              startedAt: taskObject.startedAt,
              failedAt: new Date(),
              error: error.stack ?? error.message ?? error
            }]
          })
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retriesCount)))
        }
        await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
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
      console.log("GT", gt)
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
