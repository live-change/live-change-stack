import App from '@live-change/framework'
const app = App.app()

import crypto from 'crypto'

function upperFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

async function triggerOnTaskStateChange(taskObject, causeType, cause) {
  await app.trigger({
    ...taskObject,
    type: 'task'+upperFirst(taskObject.state),
    task: taskObject.id,
    causeType,
    cause
  })
  await app.trigger({
    ...taskObject,
    type: 'task'+upperFirst(taskObject.name)+upperFirst(taskObject.state),
    task: taskObject.id,
    causeType,
    cause
  })
  await app.trigger({
    ...taskObject,
    type: `${taskObject.causeType}_${taksObject.cause}OwnedTask`
      +`${upperFirst(taskObject.name)}${upperFirst(taskObject.state)}`,
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

  let taskObject = oldTask
    ? await app.serviceViewGet('task', 'task', { task: oldTask.to })
    : {
      id: app.generateUid(),
      name: taskDefinition.name,
      properties: props,
      hash,
      state: 'created'
    }

  if(!oldTask) {
    /// app.emitEvents
    await app.triggerService('task', {
      ...taskObject,
      type: 'task_createCaseOwnedTask',
      causeType,
      cause,
      task: taskObject.id
    })
    await triggerOnTaskStateChange(taskObject, causeType, cause)
  }

}

async function startTask(taskFunction, props, causeType, cause){
  const taskObject = createOrReuseTask(taskFunction.definition, props, causeType, cause)
  const context = {
    causeType,
    cause,
    taskObject
  }
  const promise = taskFunction(props, context)
  return { task: taskObject.id, taskObject, promise }
}

export default function task(definition) {
  const taskFunction = async (props, context, emit) => {
    if(!emit) emit = (events) =>
      app.emitEvents(definition.name, Array.isArray(events) ? events : [events], {})

    let taskObject = context.taskObject
      ?? await createOrReuseTask(taskDefinition, props, context.causeType, context.cause)

    const maxRetries = definition.maxRetries ?? 5

    async function updateTask(data) {
      await app.triggerService('task', {
        ...data,
        type: 'task_updateCaseOwnedTask',
        causeType: context.causeType,
        cause: context.cause,
        task: taskObject.id
      })
      taskObject = await app.serviceViewGet('task', 'task', { task: oldTask.to })
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
            async run(taskFunction, props) {
              return await taskFunction(props, {
                ...context,
                causeType: definition.name + '_Task',
                cause: taskObject.id
              }, (events) => app.emitEvents(definition.name,
                Array.isArray(events) ? events : [events], {}))
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
        if(taskObject.retries.length >= maxRetries) {
          await updateTask({
            state: 'failed',
            doneAt: new Date(),
            error: error.message
          })
          await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
        }
        await updateTask(taskObject.id, {
          state: 'retrying',
          retries: [...taskObject.retries, {
            startedAt: taskObject.startedAt,
            failedAt: new Date(),
            error: error.message
          }]
        })
        await triggerOnTaskStateChange(taskObject, context.causeType, context.cause)
      }
    }

    /// TODO: implement task queues
    while(taskObject.state !== 'done' && taskObject.state !== 'failed') {
      await runTask()
    }

    return taskObject.result
  }

  taskFunction.definition = definition
  taskFunction.start = async (props, causeType, cause) => {
    return await startTask(taskFunction, props, causeType, cause)
  }
  return taskFunction

}
