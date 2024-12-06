import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

const Balance = definition.foreignModel('balance', 'Balance')
const Operation = definition.foreignModel('balance', 'Operation')

definition.action({
  name: 'createBalance',
  properties: {
    name: {
      type: String,
      validation: ["nonEmpty"]
    }
  },
  returns: {
    type: Balance
  },
  async execute({ name }, { service, client, triggerService }, emit) {
    await triggerService({
      service: 'accessControl',
      type: 'accessControl_setOrUpdatePublicAccess'
    }, {
      objectType: 'balanceTest_balance',
      object: name,
      sessionRoles: ['owner'],
    })
    return await triggerService({
      service: 'balance',
      type: 'balance_setBalance'
    }, {
      ownerType: 'balanceTest_balance',
      owner: name
    })
  }
})

definition.action({
  name: 'deleteBalance',
  properties: {
    name: {
      type: String,
      validation: ["nonEmpty"]
    }
  },
  async execute({ name }, { service, client, triggerService }, emit) {
    return await triggerService({
      service: 'balance',
      type: 'balance_resetBalance'
    }, {
      ownerType: 'balanceTest_balance',
      owner: name
    })
  }
})

definition.view({
  name: 'allBalances',
  properties: {
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Balance
    }
  },
  async daoPath(range, { client, service }, method) {
    return await Balance.rangePath(range)
  }
})

definition.action({
  name: 'startOperation',
  properties: {
    balance: {
      type: Balance,
      validation: ['nonEmpty']
    },
    change: {
      type: Number,
      validation: ['nonEmpty', 'integer']
    },
    name: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ balance, change, name }, { client, service, triggerService }, emit) {
    return await triggerService({
      service: 'balance',
      type: 'balance_startOperation'
    }, {
      balance, change,
      causeType: 'balanceTest_operation',
      cause: name
    })
  }
})

definition.action({
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
  async execute({ balance, operation }, { client, service, triggerService }, emit) {
    return await triggerService({
      service: 'balance',
      type: 'balance_finishOperation'
    }, {
      balance, operation
    })
  }
})

definition.action({
  name: 'cancelOperation',
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
  async execute({ balance, operation }, { client, service, triggerService }, emit) {
    return await triggerService({
      service: 'balance',
      type: 'balance_cancelOperation'
    }, {
      balance, operation
    })
  }
})

definition.action({
  name: 'doOperation',
  properties: {
    balance: {
      type: Balance,
      validation: ['nonEmpty']
    },
    change: {
      type: Number,
      validation: ['nonEmpty', 'integer']
    },
    name: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ balance, change, name }, { client, service, triggerService }, emit) {
    return await triggerService({
      service: 'balance',
      type: 'balance_doOperation'
    }, {
      balance, change,
      causeType: 'balanceTest_operation',
      cause: name
    })
  }
})
