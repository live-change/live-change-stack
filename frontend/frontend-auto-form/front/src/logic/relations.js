import { useApi } from '@live-change/vue3-ssr'

function ensureArray(value) {
  if(!Array.isArray(value)) return [value]
  return value
}

function getWhat(relation) {
  if(typeof relation === 'string') return relation
  return relation.what
}
function getWhats(relations) {
  if(!Array.isArray(relations)) relations = [relations]
  return relations.map(x => ensureArray(getWhat(x)))
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
        what: ensureArray(getWhat(relation)),
      }
      if(filter(result)) results.push(result)
    }
  }
  for(const type of anyRelationsTypes) {
    let relations = model[type]
    if(!relations) continue
    if(!Array.isArray(relations)) relations = [relations]
    for(const relation of relations) {
      const to = (Array.isArray(relation.to) ? relation.to : [relation.to ?? 'owner'])
      const possibleTypes = to.map(other => {
        const name = other.name ? other.name : other
        const typesConfig = relation[name + 'Types'] || []
        const otherTypes = other.types || []
        return Array.from(new Set(
          typesConfig.concat(otherTypes)
        ))
      })
      const allTypes = Array.from(new Set(
        (relation.parentsTypes || [])
          .concat(possibleTypes.filter(x => !!x).flat()
      )))
      const result = {
        from: model,
        relation: type,
        what: allTypes,
        any: allTypes.length === 0
      }
      if(filter(result)) results.push(result)
    }
  }
  return results
}

export function getBackwardRelations(model, includeAny, api = useApi()) {
  model = getModelByTypeName(model, api)
  const key = `${model.serviceName}_${model.name}`
  //console.log("KEY", key)
  return Object.values(api.services).map(
    service => Object.values(service.models).map(
      model => getForwardRelations(model, ({ what, any }) => (any && includeAny) || what.includes(key), api)
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
