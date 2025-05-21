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

function getPropertyNames(relation) {
  if(typeof relation === 'string') return relation[0].toLowerCase() + relation.slice(1)
  if(relation.propertyNames) return relation.propertyNames
  return ensureArray(relation.what).map(x => x[0].toLowerCase() + x.slice(1))
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
      const fields = ensureArray(getPropertyNames(relation))
      const result = {
        from: model,
        relation: type,
        what,
        fields
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
      const views = []
      const singular = relationTypes[relation].singular && fields.length < 2

      if(singular) {
        views.push({
          name: 'read',
          identifiers: {
            [fields[0]+'Type']: objectType,
            [fields[0]]: object
          }
        })
      } else {
        for(const field of fields) {      
          const possibleFieldTypes = (relationConfig[field+'Types'] ?? [])
            .concat(relationConfig.parentsTypes ?? [])
          if(possibleFieldTypes.length === 0 || possibleFieldTypes.includes(objectType)) {
            const name = 'rangeBy' + field[0].toUpperCase() + field.slice(1)
            if(from.crud?.[name]) views.push({
              name,
              identifiers: {
                [field+'Type']: objectType,
                [field]: object
              }
            })
          }
        }
      }
      /* console.error("relation", relation, 'from', from, "type", relationTypes[relation],
         "what", what, "fields", fields) */
      return {
        model: from.name,
        service: from.serviceName,
        fields,
        relation,
        what,
        views,
        access,
        singular
      }
    } else {
      const views = []
      const singular = relationTypes[relation].singular && what.length < 2
      const name = 'rangeBy_' + objectType
      const typeView = from.crud?.[name]
        ? name
        : undefined        
      if(typeView) {
        views.push({
          name: typeView,
          identifiers: {
            [model[0].toLowerCase() + model.slice(1)]: object
          }
        })
      } else {
        for(let i = 0; i < what.length; i++) {
          if(what[i] !== objectType) continue
          const propertyName = relationConfig.propertyNames?.[i]
            ?? model[0].toLowerCase() + model.slice(1)
          const name = 'rangeBy' + propertyName[0].toUpperCase() + propertyName.slice(1)          
          if(!from.crud?.[name]) continue
          views.push({
            name,            
            identifiers: {
              [propertyName]: object
            }
          })
        }
      }
      console.log(objectType, "VIEWS", views, "FROM", from, "SINGULAR", singular)
      return {
        model: from.name,
        service: from.serviceName,
        fields,
        relation,
        what,
        access,
        views,
        singular
      }
    }
  })

  return preparedBackwardRelations
}

export function getAllPossibleTypes(api = useApi(), filter = () => true,) {  
  return Object.entries(api.services).map(
    ([serviceName, service]) => Object.values(service.models).filter(o => filter(o, service, serviceName)).map(
      model => `${serviceName}_${model.name}`
    ).flat()
  ).flat()
}

export function getAllTypesWithCrud(crud, api = useApi()) {  
  return getAllPossibleTypes(api, (model, service, serviceName) => {
    if(model.crud?.[crud]) return true
  })
}

export function parentObjectsFromIdentifiers(identifiers, modelDefinition) {
  console.log("identifiers", identifiers, "modelDefinition", modelDefinition)
  const results = []
  for(const [key, value] of Object.entries(identifiers)) {
    if(key.endsWith('Type')) continue
    const identifierDefinition = (modelDefinition.identifiers ?? []).find(i => i.name === key)
    if(identifierDefinition && identifierDefinition.field === 'id') continue
    const propertyDefinition = modelDefinition.properties[key]
    if(!propertyDefinition) continue
    const propertyType = propertyDefinition.type
    if(propertyType === 'any') {
      results.push({
        objectType: identifiers[key + 'Type'],
        object: value
      })
    } else {
      results.push({
        objectType: propertyType,
        object: value
      })
    }
  }
  return results
}