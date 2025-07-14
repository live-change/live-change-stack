import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

const Vote = definition.model({
  name: "Vote",
  sessionOrUserProperty: {
    extendedWith: ['on'],
    ownerReadAccess: () => true,
    ownerWriteAccess: () => true,
  },
  properties: {
    power: {
      type: Number,
      validation: ['nonEmpty'/*, {
        name: 'switchBy',
        prop: 'onType',
        cases: {
          ...definition.config.voteValidators
        }
      }*/],
      defaultValue: 0
    }
  },
  indexes: {
    byOnExtended: {
      property: ['onType', 'on'],
      function: async function(input, output) {
        function mapper(obj) {
          return obj && {
            id: `"${obj.onType}":"${obj.on}"_${obj.id}`,
            onType: obj.onType,
            on: obj.on,
            to: obj.id,
            power: obj.power
          }
        }
        await input.table('vote_Vote').onChange(
            (obj, oldObj) => output.change(mapper(obj), mapper(oldObj))
        )
      }
    },
    voteCount: {
      property: ['onType', 'on'],
      //dependsOn: ['byOn'],
      function: async function(input, output) {
        const sourceIndex = await input.index('vote_Vote_byOnExtended')
        await sourceIndex.onChange(
          async (obj, oldObj) => {
            const prefix = ((obj && obj.id) || (oldObj && oldObj.id)).split('"_"')[0]+'"'
            if(!prefix) {
              output.debug("NO PREFIX FOR CHANGE", obj, oldObj)
              return
            }
            output.debug("PREFIX", prefix.split(':'))
            const [onType, on] = prefix.split(':').map(x => JSON.parse(x))
            const votes = await sourceIndex.rangeGet({
              gt: prefix + '_',
              lt: prefix + '_\xFF',
              limit: 1000
            })
            let voteSum = 0
            for(const vote of votes) {
              voteSum += vote.power || 0
            }
            output.put({
              id: prefix,
              onType, on,
              sum: voteSum,
              count: votes.length
            })
          }
        )
      }
    },
    byTypeAndSum: {
      function: async function(input, output) {
        function mapper(obj) {
          return obj && {
            id: `${JSON.stringify(obj.onType)}:${obj.sum.toFixed(3).padStart(12, '0')}:${JSON.stringify(obj.on)}`,
            onType: obj.onType,
            on: obj.on,
            sum: obj.sum,
            count: obj.count,
          }
        }
        await input.index('vote_Vote_voteCount').onChange(
            (obj, oldObj) => output.change(mapper(obj), mapper(oldObj))
        )
      }
    },
    byTypeAndCount: {
      function: async function(input, output) {
        function mapper(obj) {
          return obj && {
            id: `${JSON.stringify(obj.onType)}:${obj.count.toFixed().padStart(8, '0')}:${JSON.stringify(obj.on)}`,
            onType: obj.onType,
            on: obj.on,
            sum: obj.sum,
            count: obj.count,
          }
        }
        await input.index('vote_Vote_voteCount').onChange(
            (obj, oldObj) => output.change(mapper(obj), mapper(oldObj))
        )
      }
    },
    byTypeAndAvg: {
      function: async function(input, output) {
        function mapper(obj) {
          return obj && obj.count > 0 && {
            id: `${JSON.stringify(obj.onType)}:${(obj.sum / obj.count).toFixed(3).padStart(12, '0')}:${JSON.stringify(obj.on)}`,
            onType: obj.onType,
            on: obj.on,
            sum: obj.sum,
            count: obj.count,
          }
        }
        await input.index('vote_Vote_voteCount').onChange(
            (obj, oldObj) => output.change(mapper(obj), mapper(oldObj))
        )
      }
    }
  }
})

const countType = {
  type: Object,
  properties: {
    onType: {
      type: String
    },
    on: {
      type: String
    },
    sum: {
      type: Number
    },
    count: {
      type: Number
    }
  }
}

definition.view({
  name: "votesSum",
  properties: {
    onType: {
      type: String,
      validation: ['nonEmpty']
    },
    on: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  returns: countType,
  async daoPath({ onType, on }, { client, service }, method) {
    const id = `${JSON.stringify(onType)}:${JSON.stringify(on)}`
    return ['database', 'indexObject', app.databaseName, 'vote_Vote_voteCount', id]
  }
})

definition.view({
  name: "votesByTypeAndSum",
  properties: {
    onType: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: countType
  },
  async daoPath(props , { client, service }, method) {
    const { onType } = props
    const range = App.utils.extractRange(props)
    const prefix = `${JSON.stringify(onType)}`
    const prefixedRange = App.utils.prefixRange(range, prefix, prefix)
    //console.log("PREF RANGE", prefixedRange)
    const daoPath = ['database', 'indexRange', app.databaseName, 'vote_Vote_byTypeAndSum', prefixedRange]
    //console.log("DAO PATH", daoPath)
    //console.log("OBJECTS", app.dao.get(daoPath))
    return daoPath
  }
})

definition.view({
  name: "votesByTypeAndCount",
  properties: {
    onType: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: countType
  },
  async daoPath(props , { client, service }, method) {
    const { onType } = props
    const range = App.utils.extractRange(props)
    const prefix = `${JSON.stringify(onType)}`
    const prefixedRange = App.utils.prefixRange(range, prefix, prefix)
    //console.log("PREF RANGE", prefixedRange)
    const daoPath = ['database', 'indexRange', app.databaseName, 'vote_Vote_byTypeAndCount', prefixedRange]
    //console.log("DAO PATH", daoPath)
    //console.log("OBJECTS", app.dao.get(daoPath))
    return daoPath
  }
})

definition.view({
  name: "votesByTypeAndAvg",
  properties: {
    onType: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: countType
  },
  async daoPath(props , { client, service }, method) {
    const { onType } = props
    const range = App.utils.extractRange(props)
    const prefix = `${JSON.stringify(onType)}`
    const prefixedRange = App.utils.prefixRange(range, prefix, prefix)
    //console.log("PREF RANGE", prefixedRange)
    const daoPath = ['database', 'indexRange', app.databaseName, 'vote_Vote_byTypeAndAvg', prefixedRange]
    //console.log("DAO PATH", daoPath)
    //console.log("OBJECTS", app.dao.get(daoPath))
    return daoPath
  }
})

export default definition
