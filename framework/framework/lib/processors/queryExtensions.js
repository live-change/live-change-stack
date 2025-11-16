
import * as utils from "../utils.js"

export default function(module, app) {
  for(let queryName in module.queries) {
    const query = module.queries[queryName]
    if(query.view) {
      if(query.update) throw new Error("Only non-update queries can have views")
      module.view({
        name: query.view?.name || queryName,
        properties: query.properties,
        returns: query.returns,
        ...query.view,
        daoPath: (properties, { client }) => {
          const runtime = module._runtime.queries[queryName]
          return runtime.daoPath(properties)
        }
      })
    }
    if(query.trigger) {
      if(query.update) throw new Error("Only non-update queries can have triggers")
      module.trigger({
        name: query.trigger?.name || queryName,
        properties: query.properties,
        returns: query.returns,
        ...query.trigger,
        execute: (properties, { client, service, trigger }, emit) => {          
          emit({
            type: query.event?.name || queryName,
            properties
          })
        }
      })
    }
    if(query.action) {
      if(query.update) throw new Error("Only non-update queries can have actions")
      module.action({
        name: query.action?.name || queryName,
        properties: query.properties,
        returns: query.returns,
        ...query.action,
        execute: (properties, { client, service, action }, emit) => {
          emit({
            type: query.event?.name || queryName,
            properties
          })
        }
      })
    }
    if(query.event || query.trigger || query.action) {
      if(!query.update) throw new Error("Only update queries can have events")
      module.event({
        name: query.event?.name || queryName,
        properties: query.properties,
        returns: query.returns,
        ...query.event,
        execute: (properties) => {
          const runtime = module._runtime.queries[queryName]
          return runtime.run(properties)
        }
      })
    }
  }
}

