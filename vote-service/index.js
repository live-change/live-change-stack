const App = require("@live-change/framework")
const app = App.app()

const definition = require('./definition.js')

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
            const votes = await sourceIndex.get({
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
    }
  }
})

module.exports = definition
