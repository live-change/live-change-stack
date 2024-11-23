import { useApi } from '@live-change/vue3-ssr'

function getWhat(relation) {
  if(typeof relation === 'string') return relation
  return relation.what
}
function getWhats(relations) {
  if(!Array.isArray(relations)) relations = [relations]
  return relations.map(getWhat)
}

export const typedRelationsTypes = ['propertyOf', 'itemOf', 'boundTo', 'relatedTo']
export const anyRelationsTypes = typedRelationsTypes.map(relation => relation + 'Any')

export function getModelByTypeName(model, api = useApi()) {
  if(typeof model === 'string') {
    const [serviceName, modelName] = model.split('_')
    return api.services[serviceName].models[modelName]
  }
  return model
}

export function getServiceByName(service, api = useApi()) {
  if(typeof service === 'string') {
    return api.services[service]
  }
  return service
}

export function getForwardRelations(model, filter = () => true, api = useApi()) {
  model = getModelByTypeName(model, api)
  const results = []
  for(const type of typedRelationsTypes) {
    let relations = model[type]
    if(!relations) continue
    if(!Array.isArray(relations)) relations = [relations]
    for(const relation of relations) {
      const result = {
        from: model,
        relation: type,
        what: getWhat(relation),
      }
      if(filter(result)) results.push(result)
    }
  }
  return results
}

export function getBackwardRelations(model, api = useApi()) {
  model = getModelByTypeName(model, api)
  const key = `${model.serviceName}_${model.name}`
  console.log("KEY", key)
  return Object.values(api.services).map(
    service => Object.values(service.models).map(
      model => getForwardRelations(model, ({ what }) => what === key, api)
    ).flat()
  ).flat()
}


export function getServiceModelsWithRelation(service, relationName, api = useApi()) {
  service = getServiceByName(service)
  if(!Array.isArray(relationName)) relationName = [relationName]
  return Array.from(new Set(Object.values(service.models).filter(
      model => relationName.some(relation => model[relation])
    ).flat()
  ))
}


export function getModelsWithRelation(relationName, api = useApi()) {
  if(!Array.isArray(relationName)) relationName = [relationName]
  return Array.from(new Set(Object.values(api.services).map(
    service => getServiceModelsWithRelation(service, relationName, api)
  ).flat()))
}
