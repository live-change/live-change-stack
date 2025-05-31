import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const taskProperties = {
  name: {
    type: String,
    validation: ['nonEmpty']
  },
  service: {
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
    type: String,
    enum: [
      'created', 'pending', 'running', 'retrying', 'done',
      'failed', 'canceled', 'fallback', 'fallbackDone', 'interrupted'
    ]
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
        },
        stack: {
          type: String
        }
      }
    },
    default: []
  },
  maxRetries: {
    type: Number,
    default: 5
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
    },
    byState: {
      property: ['state']
    },
    byName: {
      property: ['name']
    },
    byNameAndState: {
      property: ['name', 'state']
    },
    independentTasks: {
      function: async function(input, output, { tableName }) {
        const table = await input.table(tableName)
        table.map(async (obj) => {
          if(obj.causeType === tableName) return null
          return { id: obj.id, to: obj.id }
        }).to(output)
      },
      parameters: {
        tableName: definition.name + '_Task'
      }
    },
    independentTasksByName: {
      function: async function(input, output, { tableName }) {
        const table = await input.table(tableName)
        table.map(async (obj) => {
          if(obj.causeType === tableName) return null
          return { id: `"${obj.name}"_${obj.id}`, to: obj.id }
        }).to(output)
      },
      parameters: {
        tableName: definition.name + '_Task'
      }
    },
    independentTasksByState: {
      function: async function(input, output, { tableName }) {
        const table = await input.table(tableName)
        table.map(async (obj) => {
          if(obj.causeType === tableName) return null
          return { id: `"${obj.state}"_${obj.id}`, to: obj.id }
        }).to(output)
      },
      parameters: {
        tableName: definition.name + '_Task'
      }
    },
    independentTasksByNameAndState: {
      function: async function(input, output, { tableName }) {
        const table = await input.table(tableName)
        table.map(async (obj) => {
          if(obj.causeType === tableName) return null
          return { id: `"${obj.name}"_${obj.state}"_${obj.id}`, to: obj.id }
        }).to(output)
      },
      parameters: {
        tableName: definition.name + '_Task'
      }
    },
    taskNames: {
      function: async function(input, output, { indexName }) {
        const index = await input.index(indexName)
        index
          .groupExisting(async (entry) => entry.id.slice(0, entry.id.indexOf('_')+1))
          .map((entry => ({ id: entry.id.slice(1, entry.id.indexOf('_')-1) })))
          .to(output)
      },
      parameters: {
        indexName: definition.name + '_Task_byName'
      }
    }, 
    independentTaskNames: {
      function: async function(input, output, { indexName }) {
        const index = await input.index(indexName)  
        index
          .groupExisting(async (entry) => entry.id.slice(0, entry.id.indexOf('_')+1))
          .map((entry => ({ id: entry.id.slice(1, entry.id.indexOf('_')-1) })))
          .to(output)
      },
      parameters: {
        indexName: definition.name + '_Task_independentTasksByName'
      }
    },
    runningRootsByName: {
      property: ['name'],
      function: async function(input, output, { tableName }) {
        function mapFunction(obj) {
          if(!obj) return null
          if(['done', 'failed', 'canceled'].includes(obj.state)) return null
          if(obj.causeType === tableName) return null
          return { id: `"${obj.name}"_${obj.id}`, to: obj.id }
        }
        await input.table(tableName).onChange(async (obj, oldObj) => {
          await output.change(mapFunction(obj), mapFunction(oldObj))
        })
      },
      parameters: {
        tableName: definition.name + '_Task'
      }
    },
    byRoot: {
      function: async function(input, output, { tableName }) {
        async function findAncestors(object){
          const result = [`"task_Task":"${object.id}"`]
          let current = object
          while(current) {
            result.push(`"${current.causeType}":"${current.cause}"`)
            current = current.causeType === tableName
              ? await input.table(tableName).object(current.cause).get()
              : null
          }
          //console.log("FOUND ANCESTORS", result, "FOR", object.id)
          return result
        }
        await input.table(tableName).onChange(async (obj, oldObj) => {
          const id = obj?.id || oldObj?.id
          const ancestors = obj ? await findAncestors(obj) : []
          const oldAncestors = oldObj ? await findAncestors(oldObj) : []
          //console.log("ANCESTORS", id, oldAncestors, '=>', ancestors)
          const addedAncestors = ancestors.filter(ancestor => !oldAncestors.includes(ancestor))
          const removedAncestors = oldAncestors.filter(ancestor => !ancestors.includes(ancestor))
          for(const ancestor of addedAncestors) {
            await output.change({ id: `${ancestor}_${id}`, to: id }, null)
          }
          for(const ancestor of removedAncestors) {
            await output.change(null, { id: `${ancestor}_${id}`, to: id })
          }
        })
      },
      parameters: {
        tableName: definition.name + '_Task'
      }
    }
  }
})

definition.view({
  name: 'tasksByCauseAndHash',
  internal: true,
  properties: {
    causeType: {
      type: String
    },
    cause: {
      type: String
    },
    hash: {
      type: String
    },
    expireDate: {
      type: Date
    }
  },
  returns: {
    type: Array,
    of: {
      type: Task
    }
  },
  async daoPath({ causeType, cause, hash }) {
    /// TODO: add expireDate to range
    return Task.indexRangePath('byCauseAndHash', [causeType, cause, hash], { limit: 23, reverse: true })
  }
})

definition.view({
  name: 'tasksByRoot',
  properties: {
    rootType: {
      type: String,
      validation: ['nonEmpty']
    },
    root: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  accessControl: {
    roles: config.taskReaderRoles,
    objects({ rootType, root }) {
      console.log("OBJECTS", rootType, root)
      return [{
        objectType: rootType,
        object: root
      }]
    }
  },
  returns: {
    type: Task
  },
  async daoPath(props) {
    const { rootType, root } = props
    const range = App.extractRange(props)
    if(!range.limit) range.limit = 256
    return Task.indexRangePath('byRoot', [rootType, root], range)
  }
})

definition.view({
  name: 'independentTasks',
  internal: true,
  properties: {  
    ...App.rangeProperties,
    name: {
      type: String
    },
    state: {
      type: String
    }
  },
  returns: {
    type: Task
  },
  access: ['admin'],
  async daoPath(props) {
    const range = App.extractRange(props)
    const { name, state } = props
    console.log("PROPS", props)
    const [index, rangePath] = name && state  
      ? ['independentTasksByNameAndState', [name, state]]
      : name
        ? ['independentTasksByName', [name]]
        : state
          ? ['independentTasksByState', [state]]
          : ['independentTasks', []]
    return Task.indexRangePath(index, rangePath, range)
  }
})

definition.view({
  name: 'taskNames',
  properties: {
    ...App.rangeProperties
  },
  returns: {
    type: String
  },
  access: ['admin'],
  async daoPath(props) {
    const range = App.extractRange(props)
    return ['database', 'indexRange', app.databaseName, definition.name + '_Task_taskNames', range]
  }
})

definition.view({
  name: 'runningTaskRootsByName',
  internal: true,
  global: true,
  properties: {
    name: {
      type: String
    },
    ...App.rangeProperties
  },
  returns: {
    type: Task
  },
  access: ['admin'],
  async daoPath(props) {
    const { name } = props
    const range = App.extractRange(props)
    if(!range.limit) range.limit = 256
    return Task.sortedIndexRangePath('runningRootsByName', [name], range)
  }
})
