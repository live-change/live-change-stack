const App = require('./lib/App.js')

module.exports = App

module.exports.app = () => {
  if(!globalThis.liveChangeFrameworkApp) {
    globalThis.liveChangeFrameworkApp = new App()
  }
  return globalThis.liveChangeFrameworkApp
}

module.exports.utils = require('./lib/utils.js')
module.exports.validation = require('./lib/utils/validation.js')
module.exports.rangeProperties = module.exports.utils.rangeProperties
module.exports.encodeIdentifier = module.exports.utils.encodeIdentifier
module.exports.extractRange = module.exports.utils.extractRange
module.exports.isomorphic = module.exports.utils.isomorphic


module.exports.ActionDefinition = require('./lib/definition/ActionDefinition.js')
module.exports.EventDefinition = require('./lib/definition/EventDefinition.js')
module.exports.ForeignIndexDefinition = require('./lib/definition/ForeignIndexDefinition.js')
module.exports.ForeignModelDefinition = require('./lib/definition/ForeignModelDefinition.js')
module.exports.IndexDefinition = require('./lib/definition/IndexDefinition.js')
module.exports.ModelDefinition = require('./lib/definition/ModelDefinition.js')
module.exports.PropertyDefinition = require('./lib/definition/PropertyDefinition.js')
module.exports.ServiceDefinition = require('./lib/definition/ServiceDefinition.js')
module.exports.TriggerDefinition = require('./lib/definition/TriggerDefinition.js')
module.exports.ViewDefinition = require('./lib/definition/ViewDefinition.js')

