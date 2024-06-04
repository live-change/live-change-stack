import App from '@live-change/framework'
const app = App.app()

import crypto from 'crypto'

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
      retries: []
    }

  console.log("TO", taskObject, 'OT', oldTask)

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
  return { task: taskObject.id, taskObject, promise }
}

export default function task(definition) {
  const taskFunction = async (props, context, emit) => {
    if(!emit) emit = (events) =>
      app.emitEvents(definition.name, Array.isArray(events) ? events : [events], {})

    let taskObject = context.taskObject
      ?? await createOrReuseTask(definition, props, context.causeType, context.cause)

    if(!taskObject?.state) throw new Error('Task object state is not defined in ' + taskObject)
    if(!taskObject?.id) throw new Error('Task object id is not defined in '+taskObject)

    const maxRetries = definition.maxRetries ?? 5

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
      const result = await app.triggerService({ service: 'task', type: 'task_updateCauseOwnedTask' }, {
        ...data,
        causeType: context.causeType,
        cause: context.cause,
        task: taskObject.id
      })

      taskObject = await app.serviceViewGet('task', 'task', { task: taskObject.id })
      //console.log("UPDATED TASK", taskObject, result)
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
            async run(taskFunction, props) {
              console.log("SUBTASK RUN", taskFunction.definition.name, props)
              const result = await taskFunction(props, {
                ...context,
                taskObject: undefined,
                task: taskObject.id,
                causeType: definition.name + '_Task',
                cause: taskObject.id
              }, (events) => app.emitEvents(definition.name,
                Array.isArray(events) ? events : [events], {}))
              console.log("SUBTASK DONE", taskFunction.definition.name, props, '=>', result)
              return result
            },
            async progress(current, total) {
              await updateTask({
                progress: { current, total }
              })
            }
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
        if((taskObject.retries?.length || 0) >= maxRetries) {
          await updateTask({
            state: 'failed',
            doneAt: new Date(),
            error: error.stack ?? error.message ?? error
          })
        } else {
          await updateTask({
            state: 'retrying',
            retries: [...(taskObject.retries || []), {
              startedAt: taskObject.startedAt,
              failedAt: new Date(),
              error: error.stack ?? error.message ?? error
            }]
          })
        }
        await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
      }
    }

    /// TODO: implement task queues
    while(taskObject.state !== 'done' && taskObject.state !== 'failed') {
      await runTask()
      console.log("TASK", definition.name, "AFTER RUNTASK", taskObject)
    }

    return taskObject.result
  }

  taskFunction.definition = definition
  taskFunction.start = async (props, causeType, cause) => {
    return await startTask(taskFunction, props, causeType, cause)
  }
  return taskFunction

}
