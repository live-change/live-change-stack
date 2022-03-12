const propertyOf = require('./propertyOf.js')
const itemOf = require('./itemOf.js')

const propertyOfAny = require('./propertyOfAny.js')
const itemOfAny = require('./itemOfAny.js')

const relatedTo = require('./relatedTo.js')
const relatedToAny = require('./relatedToAny.js')

const boundTo = require('./boundTo.js')
const boundToAny = require('./boundToAny.js')

const processors = [
  propertyOf, itemOf,
  propertyOfAny, itemOfAny,
  relatedTo, relatedToAny,
  boundTo, boundToAny
]

module.exports = function(app, services) {
  app.defaultProcessors.push(...processors)
}

module.exports.processors = [
    ...processors
]