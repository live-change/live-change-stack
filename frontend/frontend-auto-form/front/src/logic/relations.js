import { useApi } from '@live-change/vue3-ssr'
import { computed } from 'vue'

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

export const relationTypes = {
  propertyOf: { singular: true, typed: true, owned: true },
  boundTo: { singular: true, typed: true, owned: false },
  itemOf: { singular: false, typed: true, owned: true },
  relatedTo: { singular: false, typed: true, owned: false },
  propertyOfAny: { singular: true, typed: false, owned: true },
  boundToAny: { singular: true, typed: false, owned: false },
  itemOfAny: { singular: false, typed: false, owned: true },
  relatedToAny: { singular: false, typed: false, owned: false }
}

export const typedRelationsTypes = Object.entries(relationTypes)
  .filter(([key, value]) => value.typed)
  .map(([key, value]) => key)
export const anyRelationsTypes = Object.entries(relationTypes)
  .filter(([key, value]) => !value.typed)
  .map(([key, value]) => key)

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

export function getForwardRelations(model, api = useApi()) {
  model = getModelByTypeName(model, api)
  const results = []
  for(const type of typedRelationsTypes) {
    const relationType = relationTypes[type]
    let relations = model[type]
    if(!relations) continue
    if(!Array.isArray(relations)) relations = [relations]
    for(const relation of relations) {
      const what = ensureArray(getWhat(relation))
      const result = {
        from: model,
        relation: type,
        what
      }
      results.push(result)
    }
  }
  for(const type of anyRelationsTypes) {
    const relationType = relationTypes[type]
    let relations = model[type]
    if(!relations) continue
    if(!Array.isArray(relations)) relations = [relations]
    for(const relation of relations) {
      const fields = (Array.isArray(relation.to) ? relation.to : [relation.to ?? 'owner'])
      const possibleTypes = fields.map(other => {
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
        fields,
        relation: type,
        what: allTypes,
        any: allTypes.length === 0
      }
      results.push(result)
    }
  }
  return results
}

export function getBackwardRelations(model, api = useApi()) {
  model = getModelByTypeName(model, api)
  const key = `${model.serviceName}_${model.name}`
  //console.log("KEY", key)
  return Object.values(api.services).map(
    service => Object.values(service.models).map(
      model => getForwardRelations(model, api).filter(({ what, any }) => what.includes(key))
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

export function prepareObjectRelations(objectType, object, api = useApi()) {
  const [service, model] = objectType.split('_')
  const backwardRelations = getBackwardRelations(objectType, api)
  const preparedBackwardRelations = backwardRelations.map(({ relation, from, what, fields }) => {
    const relationConfig = from[relation]

    const access = computed(() => {
      const serviceMetadata = api.metadata.api.value.services.find(s => s.name === from.serviceName)
      return Object.fromEntries(
        Object.entries(from.crud).map(([key, value]) =>
          [key, !!serviceMetadata.actions[value] || !!serviceMetadata.views[value]]
        )
      )
    })

    if(anyRelationsTypes.includes(relation)) {
      const identifiers = []
      for(const field of fields) {
        const possibleFieldTypes = (relationConfig[field+'Types'] ?? [])
          .concat(relationConfig.parentsTypes ?? [])
        if(possibleFieldTypes.length === 0 || possibleFieldTypes.includes(objectType)) {
          identifiers.push({
            [field+'Type']: objectType,
            [field]: object
          })
        }
      }
      return {
        model: from.name,
        service: from.serviceName,
        fields,
        relation,
        what,
        identifiers,
        access,
        singular: relationTypes[relation].singular && what.length < 2
      }
    } else {
      const singular = relationTypes[relation].singular && what.length < 2
      const typeView = from.crud?.['rangeBy_'+objectType]
        ? 'rangeBy_'+objectType
        : undefined
      const view = relationConfig?.view ?? (singular
          ? undefined
          : typeView
      ) ?? undefined
      const identifiers = []
      if(typeView) {
        identifiers.push({
          [model[0].toLowerCase() + model.slice(1)]: object
        })
      } else {
        for(let i = 0; i < what.length; i++) {
          if(what[i] !== objectType) continue
          const propertyName = relationConfig.propertyNames?.[i]
            ?? model[0].toLowerCase() + model.slice(1)
          identifiers.push({
            [propertyName]: object
          })
        }
      }
      console.log(objectType, "VIEW", view, from, singular)
      return {
        model: from.name,
        service: from.serviceName,
        fields,
        relation,
        what,
        identifiers,
        access,
        view,
        singular
      }
    }
  })

  return preparedBackwardRelations
}
