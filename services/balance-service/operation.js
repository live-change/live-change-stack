import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import { Balance } from './balance.js'

const Operation = definition.model({
  name: "Operation",
  itemOf: {
    what: Balance,
    readAccessControl: {
      roles: ['owner', 'admin']
    }
  },
  properties: {
    state: {
      type: String,
      options: [
        'started', // funds are locked, but amount is not changed yet
        'finished' // amount is changed, and funds are unlocked
      ],
    },

    causeType: {
      type: String,
      validation: ['nonEmpty']
    },
    cause: {
      type: String,
      validation: ['nonEmpty']
    },

    change: config.currencyType,
    amountBefore: config.currencyType,
    amountAfter: config.currencyType,

    updatedAt: {
      type: Date,
      updated: () => new Date(),
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  indexes: {
/*    byCauseAndTime: {
      function: async (input, output, { tableName }) => {
        const table = await input.table(tableName)
        const mapper = obj => obj ? {
          id: [
            obj.causeType,
            obj.cause,
            obj.updatedAt ?? obj.createdAt
          ].map(v => JSON.stringify(v)).join(':')+'_'+obj.id,
          to: obj.id
        } : null
        await table.onChange(async (object, oldObject) => {
          await output.change(mapper(object), mapper(oldObject))
        })
      },
      parameters: {
        tableName: definition.name + '_Operation'
      }
    },*/
    byCauseStateAndTime: {
      function: async (input, output, { tableName }) => {
        const table = await input.table(tableName)
        const mapper = obj => obj ? {
          id: [
            obj.causeType,
            obj.cause,
            obj.state,
            obj.updatedAt ?? obj.createdAt
          ].map(v => JSON.stringify(v)).join(':')+'_'+obj.id,
          to: obj.id
        } : null
        await table.onChange(async (object, oldObject) => {
          await output.change(mapper(object), mapper(oldObject))
        })
      },
      parameters: {
        tableName: definition.name + '_Operation'
      }
    },
    byBalanceAndTime: {
      function: async (input, output, { tableName }) => {
        const table = await input.table(tableName)
        const mapper = obj => obj ? {
          id: [
            obj.balance,
            obj.updatedAt ?? obj.createdAt
          ].map(v => JSON.stringify(v)).join(':')+'_'+obj.id,
          to: obj.id
        } : null
        await table.onChange(async (object, oldObject) => {
          await output.change(mapper(object), mapper(oldObject))
        })
      },
      parameters: {
        tableName: definition.name + '_Operation'
      }
    },
    byBalanceStateAndTime: {
      function: async (input, output, { tableName }) => {
        const table = await input.table(tableName)
        const mapper = obj => obj ? {
          id: [
            obj.balance,
            obj.state,
            obj.updatedAt ?? obj.createdAt
          ].map(v => JSON.stringify(v)).join(':')+'_'+obj.id,
          to: obj.id
        } : null
        await table.onChange(async (object, oldObject) => {
          await output.change(mapper(object), mapper(oldObject))
        })
      },
      parameters: {
        tableName: definition.name + '_Operation'
      }
    },
  }
})

export { Operation }

definition.view({
  name: 'operationsByBalance',
  properties: {
    balance: {
      type: Balance,
      validation: ['nonEmpty']
    },
    state: {
      type: String
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Operation
    }
  },
  accessControl: {
    roles: config.readerRoles,
    objects: async (params) => {
      return [{ objectType: definition.name + '_Balance', object: params.balance }]
    }
  },
  async daoPath(params, { client, service }, method) {
    const range = App.extractRange(params)
    const { balance, state } = params
    if(state) {
      return Operation.indexRangePath('byBalanceStateAndTime', [balance, state], range)
    } else {
      return Operation.indexRangePath('byBalanceAndTime', balance, range)
    }
  }
})

definition.trigger({
  name: "startOperation",
  properties: {
    balance: {
      type: Balance,
      validation: ['nonEmpty']
    },
    causeType: {
      type: String,
      validation: ['nonEmpty']
    },
    cause: {
      type: String,
      validation: ['nonEmpty']
    },
    change: {
      ...config.currencyType,
      validation: ['nonEmpty']
    }
  },

  queuedBy: ['balance'],
  async execute({ balance, causeType, cause, change }, { client, service, triggerService }) {
    const operation = app.generateUid()
    const balanceData = await Balance.get(balance)
    if(!config.changePossible(balanceData.available, change)) throw "insufficientFunds"
    const newAvailable = config.currencyAdd(balanceData.available, change)
    await triggerService({
      service: definition.name,
      type: 'balance_createBalanceOwnedOperation',
    }, {
      state: 'started',
      balance, causeType, cause, change,
      amountBefore: balanceData.amount,
      amountAfter: null
    })
    await triggerService({
      service: definition.name,
      type: 'balance_updateOwnerOwnedBalance',
    }, {
      ownerType: balanceData.ownerType, owner: balanceData.owner,
      available: newAvailable
    })
    return operation
  }
})

definition.trigger({
  name: 'finishOperation',
  properties: {
    balance: {
      type: Balance,
      validation: ['nonEmpty']
    },
    operation: {
      type: Operation,
      validation: ['nonEmpty']
    }
  },
  queuedBy: ['balance'],
  async execute({ balance, operation }, { client, service, triggerService }) {
    const operationData = await Operation.get(operation)
    if(!operationData) throw "operationNotFound"
    if(operationData.state !== 'started') throw "operationNotStarted"
    if(operationData.balance !== balance) throw "balanceMismatch"
    const balanceData = await Balance.get(balance)
    const newAmount = config.currencyAdd(balanceData.amount, operationData.change)
    const newAvailable = config.currencyAdd(balanceData.available, config.currencyNegate(operationData.change))
    await triggerService({
      service: definition.name,
      type: 'balance_updateBalanceOwnedOperation',
    }, {
      operation,
      state: 'finished',
      amountAfter: newAmount
    })
    await triggerService({
      service: definition.name,
      type: 'balance_updateOwnerOwnedBalance',
    }, {
      ownerType: balanceData.ownerType, owner: balanceData.owner,
      available: newAvailable,
      amount: newAmount
    })
    return operation
  }
})

definition.trigger({
  name: 'doOperation',
  properties: {
    balance: {
      type: Balance,
      validation: ['nonEmpty']
    },
    causeType: {
      type: String,
      validation: ['nonEmpty']
    },
    cause: {
      type: String,
      validation: ['nonEmpty']
    },
    change: {
      ...config.currencyType,
      validation: ['nonEmpty']
    }
  },
  queuedBy: ['balance'],
  async execute({ balance, causeType, cause, change }, { client, service, triggerService }) {
    const operation = app.generateUid()
    const balanceData = await Balance.get(balance)
    if(!config.changePossible(balanceData.available, change)) throw "insufficientFunds"
    const newAmount = config.currencyAdd(balanceData.amount, change)
    await triggerService({
      service: definition.name,
      type: 'balance_createBalanceOwnedOperation',
    }, {
      state: 'finished',
      balance, causeType, cause, change,
      amountBefore: balanceData.amount,
      amountAfter: newAmount
    })
    await triggerService({
      service: definition.name,
      type: 'balance_updateOwnerOwnedBalance',
    }, {
      ownerType: balanceData.ownerType, owner: balanceData.owner,
      amount: newAmount
    })
    return operation
  }
})