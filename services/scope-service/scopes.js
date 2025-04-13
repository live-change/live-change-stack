import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config

const scopes = []

/// Collect all models that have are scopes
definition.processor(function(service, app) {
  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(!model.scope) continue    
    scopes.push(service.name + '_' + modelName)
  }
})

const Scope = definition.model({
  name: "Scope",
  properties: {    
    type: {
      type: String
    }
  }
})

definition.afterStart(async () => {
  const destObjects = scopes.map(type => ({
    id: type,
    type
  }))          
  let idsSet = new Set(destObjects.map(obj => obj.id))
  const existingScopes = await Scope.rangeGet({})
  const promises = []
  for(const obj of destObjects) {
    promises.push(Scope.create(obj))
  }
  for(const scope of existingScopes) {
    if(!idsSet.has(scope.id)) {
      promises.push(Scope.delete(scope.id))
    }
  }
  await Promise.all(promises)
})

export { scopes, Scope }
