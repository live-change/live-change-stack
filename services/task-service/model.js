import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

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
    },
    byState: {
      property: ['state']
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
    }
  },
  returns: {
    type: Array,
    of: {
      type: Task
    }
  },
  async daoPath({ causeType, cause, hash }) {
    return Task.indexRangePath('byCauseAndHash', [causeType, cause, hash], { limit: 23 })
  }
})

definition.view({
  name: 'task',
  internal: true,
  properties: {
    task: {
      type: String
    }
  },
  returns: {
    type: Task
  },
  async daoPath({ task }) {
    return Task.path(task)
  }
})
