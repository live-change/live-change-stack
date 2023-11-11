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
  }
})

module.exports = definition
