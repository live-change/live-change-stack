import App from '@live-change/framework'
const app = App.app()

const task = (taskDefinition) => { /// TODO: modify to use triggers
  return async (props, context, emit) => {
    if(!emit) emit = (events) => app.emitEvents(definition.name, Array.isArray(events) ? events : [events], {})
    const propertiesJson = JSON.stringify(props)
    const hash = crypto
      .createHash('sha256')
      .update(taskDefinition.name + ':' + propertiesJson)
      .digest('hex')

    const similarTasks = App.serviceViewGet('task', 'tasksByCauseAndHash', {
      causeType: context.causeType,
      cause: context.cause,
      hash
    })
    const oldTask = similarTasks.find(similarTask => similarTask.name === taskDefinition.name
      && JSON.stringify(similarTask.properties) === propertiesJson)

    let taskObject = oldTask
      ? await App.serviceViewGet('task', 'task', { task: oldTask.to })
      : {
        id: app.generateUid(),
        name: taskDefinition.name,
        properties: props,
        hash,
        state: 'created'
      }

    if(!oldTask) {
      /// app.emitEvents
      await App.triggerService('task', 'task_createCaseOwnedTask', {
        ...taskObject,
        causeType: context.causeType,
        cause: context.cause,
        task: taskObject.id
      })
    }

    const maxRetries = taskDefinition.maxRetries ?? 5

    async function updateTask(data) {
      await App.triggerService('task', 'task_updateCaseOwnedTask', {
        ...data,
        causeType: context.causeType,
        cause: context.cause,
        task: taskObject.id
      })
      taskObject = await App.serviceViewGet('task', 'task', { task: oldTask.to })
    }

    const runTask = async () => {
      await updateTask({
        state: 'running',
        startedAt: new Date()
      })
      try {
        const result = await taskDefinition.execute(props, {
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
      } catch(error) {
        if(taskObject.retries.length >= maxRetries) {
          await updateTask({
            state: 'failed',
            doneAt: new Date(),
            error: error.message
          })
        }
        await updateTask(taskObject.id, {
          state: 'retrying',
          retries: [...taskObject.retries, {
            startedAt: taskObject.startedAt,
            failedAt: new Date(),
            error: error.message
          }]
        })
      }
    }

    /// TODO: implement task queues
    while(taskObject.state !== 'done' && taskObject.state !== 'failed') {
      await runTask()
    }

    return taskObject.result
  }
}
