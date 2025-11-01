
export default function clientSideFilter(service, definition, app, client) {
/*  for(let actionName in service.actions) {
    const action = service.actions[actionName]

  }
  for(let viewName in service.views) {
    const view = service.views[viewName]

  }
  */

  for(let modelName in definition.models) {
    const model = definition.models[modelName]
    if(model.indexes) delete model.indexes
  }

  if(!(client.roles.includes('admin'))) {
    delete definition.triggers
  }

  delete definition.events  
  delete definition.authenticators
  delete definition.processors
  delete definition.validators
  delete definition.processed
  delete definition.foreignModels
  delete definition.foreignIndexes
  delete definition.config
  delete definition.indexes
  delete definition.endpoints
  delete definition.beforeStartCallbacks
  delete definition.internalViews
}
