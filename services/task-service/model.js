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
    }
  }
})
