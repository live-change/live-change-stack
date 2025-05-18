import App, { AccessSpecification, ServiceDefinition } from "@live-change/framework"
const app = App.app()
import { allCombinations } from "./combinations.js"
import {
  registerParentDeleteTriggers, registerParentCopyTriggers
} from "./changeTriggers.js"
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition, TriggerDefinition,
  ServiceDefinitionSpecification,
  PropertyDefinitionSpecification
} from "@live-change/framework"

export {
  extractObjectData, extractIdentifiers
} from './dataUtils.js'

import pluralize from 'pluralize'
import { ModelDefinitionSpecificationWithEntity } from "./entityUtils.js"
import { AccessControlSettings, ModelDefinitionSpecificationWithAccessControl, PreparedAccessControlSettings } from "./types.js"

export function extractIdParts(otherPropertyNames: string[], properties: Record<string, any>) {
  const idParts = []
  for (const propertyName of otherPropertyNames) {
    idParts.push(properties[propertyName])
  }
  return idParts
}


export function generateId(otherPropertyNames: string[], properties: Record<string, any>) {
  return otherPropertyNames.length > 1
      ? otherPropertyNames.map(p => JSON.stringify(properties[p])).join(':')
      : properties[otherPropertyNames[0]]
}

export function defineProperties(model: ModelDefinitionSpecificationWithAccessControl,
                                 types: string[], names: string[])
                                 : Record<string, PropertyDefinition<PropertyDefinitionSpecification>> {
  const identifiers = {}
  for (let i = 0; i < types.length; i++) {
    identifiers[names[i]] = new PropertyDefinition({
      type: types[i],
      validation: ['nonEmpty']
    })
  }
  for(const key in identifiers) {
    model.properties[key] = identifiers[key]
  }
  return identifiers
}

export function defineIndex(model: ModelDefinitionSpecificationWithAccessControl,
                            what: string, props: string[], multi = undefined) {
  console.log("DEFINE INDEX", model.name, what, props)
  model.indexes['by' + what] = {
    property: props,
    multi
  }
}
export function defineIndexes(model: ModelDefinitionSpecificationWithAccessControl,
                              props: Record<string, any>, types: string[]) {
  console.log("DEFINE INDEXES!", model.name, props, types)
  const propCombinations = allCombinations(Object.keys(props)) /// combinations of indexes
  for(const propCombination of propCombinations) {
    const upperCaseProps = propCombination.map(id => {
      const prop = props[id]
      return prop[0].toUpperCase() + prop.slice(1)
    })
    const indexProps = propCombination.map(id => props[id])
    defineIndex(model, upperCaseProps.join('And'), indexProps)
  }
  const propsByType = {}
  for(const prop in props) {
    const type = types[prop]
    if(!propsByType[type]) propsByType[type] = []
    propsByType[type].push(prop)
  }
  const multiPropsTypes = Object.keys(propsByType).filter(type => propsByType[type].length > 1)
  const typeCombinations = allCombinations(multiPropsTypes)
  for(const typeCombination of typeCombinations) {
    const typeNames = typeCombination.map(t => {
      const type = t.split('_')[1]
      return type[0].toUpperCase() + type.slice(1)
    })
    const typeProps = typeCombination.map(type => propsByType[type])
    defineIndex(model, typeNames.join('And'), typeProps, true)
  }
}

export interface RelationConfig {
  what: string | string[]
  propertyNames?: string[]
  writeableProperties?: string[]
  prefix?: string
  suffix?: string
  globalView?: boolean
  readAllAccess?: AccessSpecification
  sortBy?: string[],
  customDeleteTrigger?: boolean, /// TODO: check if this is needed
  customParentCopyTrigger?: boolean /// TODO: check if this is needed
}

export interface ModelDefinitionSpecificationWithRelation extends ModelDefinitionSpecificationWithAccessControl {  
}

interface RelationContext {
  service: ServiceDefinition<ServiceDefinitionSpecification>
  app: App
  model: ModelDefinitionSpecificationWithRelation
  originalModelProperties: Record<string, PropertyDefinitionSpecification>
  modelProperties: string[]
  modelPropertyName: string
  modelName: string
  modelRuntime: any
  annotation: string
  objectType: string
  parentsTypes: string[]
  otherPropertyNames: string[]
  joinedOthersPropertyName: string
  joinedOthersClassName: string
  writeableProperties: string[]
  others: any[],
  reverseRelationWord?: string
  relationWord?: string,
  identifiers?: Record<string, PropertyDefinition<PropertyDefinitionSpecification>>
}

export function processModelsAnnotation<PreparedConfig extends RelationConfig>
     (service: ServiceDefinition<ServiceDefinitionSpecification>, app: App, annotation: string, multiple: boolean,
     cb: (config: PreparedConfig, context: RelationContext) => void) {
  if (!service) throw new Error("no service")
  if (!app) throw new Error("no app")

  for(let modelName in service.models) {
    const model = service.models[modelName]

    //console.log("PO", modelName, model[annotation])

    if (model[annotation]) {
      if (model[annotation + 'Processed']) throw new Error("duplicated processing of " + annotation + " processor")
      model[annotation + 'Processed'] = true

      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)
      const modelPropertyName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1)

      if(!model.editableProperties) model.editableProperties = modelProperties
      model.crud = {}

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      if (!model.indexes) {
        model.indexes = {}
      }

      let configs
      if(multiple) {
        configs = Array.isArray(model[annotation]) ? model[annotation] : [ model[annotation] ]
      } else { // only single ownership is possible, but may be owned by objects set
        configs = [ model[annotation] ]
      }

      for(let config of configs) {
        if (typeof config == 'string' || Array.isArray(config)) {
          config = { what: config }
        }

        console.log("MODEL " + modelName + " IS " + annotation + " " + config.what ?? '')

        const what = (Array.isArray(config.what) ? config.what : [config.what])
        const others = what.map(other => other.getTypeName ? other.getTypeName() : (other.name ? other.name : other))

        const writeableProperties = modelProperties || config.writeableProperties
        const otherNames = what.map(other => other.name ? other.name : other)
        const otherPropertyNames = config.propertyNames
          ?? otherNames.map(name => name[0].toLowerCase() + name.slice(1))

        const joinedOthersPropertyName = (otherNames[0][0].toLowerCase() + otherNames[0].slice(1)) +
            (otherNames.length > 1 ? ('And' + otherNames.slice(1).join('And')) : '')
        const joinedOthersClassName = otherNames.join('And')
        const objectType = service.name + '_' + modelName

        const context: RelationContext = {
          service, app, model, originalModelProperties, modelProperties, modelPropertyName, modelRuntime,
          otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName,
          others, annotation, objectType, parentsTypes: others
        }

        cb(config, context)
      }
    }
  }
}

export function addAccessControlParents(context: RelationContext) {
  const { modelRuntime } = context
  context.model.accessControlParents = context.model.accessControlParents ?? (async (what) => {
    const id = what.object
    const data = await modelRuntime().get(id)
    return context.otherPropertyNames.map((otherPropertyName, i) => {
      const other = context.others[i]
      const objectType = other
      const object = data[otherPropertyName]
      return { objectType, object }
    }).filter(parent => parent.object && parent.objectType)
  })
  context.model.accessControlParentsSource = context.model.accessControlParentsSource ?? context.otherPropertyNames.map(
    (otherPropertyName, i) => {
      const other = context.others[i]
      return ({
        property: otherPropertyName,
        type: other
      })
    }
  )
}


export function prepareAccessControl(accessControl: AccessControlSettings, names: string[], types: string[]) {
  if(typeof accessControl == 'object') {
    const ac = accessControl as PreparedAccessControlSettings
    ac.objects = ac.objects ?? ((params) => names.map((name, index) => ({
      objectType: types[index],
      object: params[name]
    })))
    ac.objParams = { names, types }
  }
}

export function cloneAndPrepareAccessControl(accessControl: AccessControlSettings, names: string[], types: string[]) {
  if(!accessControl) return accessControl
  if(Array.isArray(accessControl)) {
    accessControl = { roles: accessControl }
  }
  const newAccessControl: PreparedAccessControlSettings = { ...(accessControl as PreparedAccessControlSettings) }
  prepareAccessControl(newAccessControl, names, types)
  return newAccessControl
}

export function defineDeleteByOwnerEvents(config: RelationConfig, context: RelationContext) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, modelPropertyName, otherPropertyNames,
  } = context
  for(const propertyName of otherPropertyNames) {
    const eventName = modelName + 'DeleteByOwner'
    service.events[eventName] = new EventDefinition({
      name: eventName,
      properties: {
        owner: {
          type: String,
          validation: ['nonEmpty']
        }
      },
      async execute({owner}) {
        const runtime = modelRuntime()
        const tableName = runtime.tableName
        const prefix = JSON.stringify(owner)
        const indexName = tableName + '_by' + propertyName[0].toUpperCase() + propertyName.slice(1)
        const bucketSize = 128
        let bucket
        do {
          bucket = await app.dao.get(['database', 'indexRange', app.databaseName, indexName, {
            gte: prefix + ':',
            lte: prefix + '_\xFF\xFF\xFF\xFF',
            limit: bucketSize
          }])
          const deletePromises = bucket.map(({to}) => runtime.delete(to))
          await Promise.all(deletePromises)
        } while (bucket.length === bucketSize)
      }
    })
  }
}

export function defineParentDeleteTriggers(config: RelationConfig, context: RelationContext) {
  registerParentDeleteTriggers(context, config)
}

export function defineParentCopyTriggers(config: RelationConfig, context: RelationContext) {
  registerParentCopyTriggers(context, config)
}

export function includeAccessRoles(model: ModelDefinitionSpecificationWithAccessControl, 
                                   access: AccessControlSettings | AccessControlSettings[]) {
  if(!access) return
  if(!model.accessRoles) model.accessRoles = []
  if(typeof access === 'string' && !model.accessRoles.find(role => role === access)) {
    model.accessRoles.push(access)
  }
  if(Array.isArray(access)) {
    for(const element of access) {
      includeAccessRoles(model, element)
    }
  } else if((access as PreparedAccessControlSettings).roles) {
    includeAccessRoles(model, (access as PreparedAccessControlSettings).roles)
  }
}

export function defineGlobalRangeView(config: {
  prefix?: string
  suffix?: string
  globalView?: boolean
  readAllAccess?: AccessSpecification
}, context: {
  service: ServiceDefinition<ServiceDefinitionSpecification>
  modelRuntime: any
  modelPropertyName: string
  modelName: string
  model: ModelDefinitionSpecificationWithAccessControl
}, external:boolean = true) {
  const { service, modelRuntime, modelPropertyName, modelName, model } = context
  const alreadyPlural = pluralize.isPlural(modelPropertyName)  
  const prefix = (config.prefix || '') + (alreadyPlural ? 'all' : '')
  const viewName =      
     prefix
     + pluralize(prefix ? modelName : modelPropertyName) 
     + (config.suffix || '')
  if(external) model.crud.range = viewName
  service.views[viewName] = new ViewDefinition({
    name: viewName,
    properties: {
      ...App.utils.rangeProperties
    },
    returns: {
      type: Array,
      of: {
        type: service.name + '_' + modelName
      }
    },
    internal: !external,
    global: config.globalView,
    access: external ? (config.readAllAccess ?? undefined) : undefined,
    daoPath(properties, { client, service }) {
      const range = App.extractRange(properties)
      const path = modelRuntime().rangePath(range)
      return path
    }
  })
}
