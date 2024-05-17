import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import crypto from 'crypto'

const taskProperties = {
  name: {
    type: String,
    validation: ['nonEmpty']
  },
  definition: {
    type: Object
  },
  properties: {
    type: Object
  },
  result: {
    type: Object
  },
  hash: {
    type: String,
  },
  state: {
    type: String
  },
  startedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  doneAt: {
    type: Date
  },
  retries: {
    type: Array,
    of: {
      type: Object,
      properties: {
        startedAt: {
          type: Date
        },
        failedAt: {
          type: Date
        },
        error: {
          type: String
        }
      }
    },
    default: []
  },
  progress: {
    type: Object,
    properties: {
      current: {
        type: Number
      },
      total: {
        type: Number
      }
    }
  }
}

const Task = definition.model({
  name: 'Task',
  itemOfAny: {
    to: 'cause',
    readAccess: () => true,
  },
  properties: {
    ...taskProperties
  },
  indexes: {
    byCauseAndHash: {
      property: ['causeType', 'cause', 'hash']
    },
    byCauseAndState: {
      property: ['causeType', 'cause', 'state']
    }
  }
})

const task = (taskDefinition) => { /// TODO: modify to use triggers
  return async (props, context, emit) => {
    if(!emit) emit = (events) => app.emitEvents(definition.name, Array.isArray(events) ? events : [events], {})
    const propertiesJson = JSON.stringify(props)
    const hash = crypto
      .createHash('sha256')
      .update(taskDefinition.name + ':' + propertiesJson)
      .digest('hex')

    const similarTasks = Task.indexRangeGet('byCauseAndHash',
      [context.causeType, context.cause, hash],
      { limit: 23 } // sha256 collisions are very unlikely
    )

    const oldTask = similarTasks.find(similarTask => similarTask.name === taskDefinition.name
      && JSON.stringify(similarTask.properties) === propertiesJson)

    let taskObject = oldTask ? await Task.get(oldTask.id) : {
      id: app.generateUid(),
      name: taskDefinition.name,
      properties: props,
      hash,
      state: 'created'
    }

    if(!oldTask) {
      /// app.emitEvents
      await Task.create({
        ...taskObject,
        causeType: context.causeType,
        cause: context.cause
      })
    }

    const maxRetries = taskDefinition.maxRetries ?? 5

    async function updateTask(data) {
      await Task.update(taskObject.id, data)
      taskObject = await Task.get(taskObject.id)
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
              }, (events) => app.emitEvents(definition.name, Array.isArray(events) ? events : [events], {}))
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
