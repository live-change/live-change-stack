const definition = require("./definition.js")

const parents = { }
const parentsSources = { }

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(!model.accessControlParents) continue
    parents[service.name + '_' + modelName] = model.accessControlParents
  }

  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(!model.accessControlParentsSource) continue
    parentsSources[service.name + '_' + modelName] = model.accessControlParentsSource
  }

})

module.exports = { parents, parentsSources }
