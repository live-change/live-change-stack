import App, { AccessSpecification, PropertyDefinitionSpecification, ServiceDefinition, ServiceDefinitionSpecification } from "@live-change/framework"
const app = App.app()
import {
  PropertyDefinition, EventDefinition,
} from "@live-change/framework"
import { allCombinations } from "./combinations.js"
import { registerParentDeleteTriggers } from "./changeTriggers.js"
import { ModelDefinitionSpecificationWithAccessControl } from "./types.js"


export function extractTypeAndIdParts(otherPropertyNames, properties) {
  const typeAndIdParts = []
  for (const propertyName of otherPropertyNames) {
    typeAndIdParts.push(properties[propertyName+'Type'])
    typeAndIdParts.push(properties[propertyName])
  }
  return typeAndIdParts
}

export function extractIdentifiersWithTypes(otherPropertyNames, properties) {
  const identifiers = {}
  for (const propertyName of otherPropertyNames) {
    identifiers[propertyName] = properties[propertyName]
    identifiers[propertyName + 'Type'] = properties[propertyName + 'Type']
  }
  return identifiers
}

export function generateAnyId(otherPropertyNames, properties) {
/*
  console.log("GEN ID", otherPropertyNames, properties, '=>',
    otherPropertyNames
      .map(p => [p+'Type', p])
      .flat()
      .map(p => JSON.stringify(properties[p])).join(':'))
*/
  return otherPropertyNames
      .map(p => [p+'Type', p])
      .flat()
      .map(p => JSON.stringify(properties[p])).join(':')
}

export function defineAnyProperties(model, names, config) {
  const identifiers = {}
  for (let i = 0; i < names.length; i++) {
    const possibleTypes = config[names[i]+'Types']
    const possibleTypesNames = possibleTypes && possibleTypes.map(t => t.getTypeName ? t.getTypeName() : t)
    identifiers[names[i]+'Type'] = new PropertyDefinition({
      type: 'type',
      validation: ['nonEmpty'],
      enum: possibleTypesNames
    })
    identifiers[names[i]] = new PropertyDefinition({
      types: possibleTypesNames,
      type: 'any',
      validation: ['nonEmpty']
    })
  }
  for(const key in identifiers) {
    model.properties[key] = identifiers[key]
  }
  return identifiers
}

export function defineAnyIndex(model, what, props) {
  model.indexes['by' + what] = {
    property: props.map(prop => [prop+'Type', prop]).flat(),
    hash: true
  }
}

export function defineAnyIndexes(model, props, fullIndex = true) {
  const propCombinations = allCombinations(props)
  for(const propCombination of propCombinations) {
    if(propCombination.length === props.length && !fullIndex) continue
    const upperCaseProps = propCombination.map(prop => prop[0].toUpperCase() + prop.slice(1))
    defineAnyIndex(model, upperCaseProps.join('And'), propCombination)
  }
}

export interface AnyRelationConfig {
  what?: string | string[]
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

export interface ModelDefinitionSpecificationWithAnyRelation extends ModelDefinitionSpecificationWithAccessControl {  
}

interface AnyRelationContext {
  service: ServiceDefinition<ServiceDefinitionSpecification>
  app: App
  model: ModelDefinitionSpecificationWithAnyRelation
  originalModelProperties: Record<string, PropertyDefinitionSpecification>
  modelProperties: string[]
  modelPropertyName: string
  modelName: string
  modelRuntime: any
  annotation: string,
  otherPropertyNames: string[]
  joinedOthersPropertyName: string
  joinedOthersClassName: string
  writeableProperties: string[]
  others: any[],
  objectType: string
  parentsTypes: string[]
  otherPossibleTypes: string[][],
  reverseRelationWord?: string,
  relationWord?: string,
  partialReverseRelationWord?: string,
  identifiers?: Record<string, PropertyDefinition<PropertyDefinitionSpecification>>
  sameIdAsParent?: boolean
}

export function processModelsAnyAnnotation<PreparedConfig extends AnyRelationConfig>
        (service: ServiceDefinition<ServiceDefinitionSpecification>, app: App, annotation: string, multiple: boolean,
        cb: (config: PreparedConfig, context: AnyRelationContext) => void) {
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
        if (typeof config == 'string' || Array.isArray(config)) config = {what: config}

        console.log("MODEL " + modelName + " IS " + annotation + " " + config.what)

        const to = (Array.isArray(config.to) ? config.to : [config.to ?? 'owner'])

        const otherPropertyNames = to.map(other => other.name ? other.name : other)

        const otherPossibleTypes = to.map(other => {
          const name = other.name ? other.name : other
          const typesConfig = config[name + 'Types'] || []
          const otherTypes = other.types || []
          return Array.from(new Set(
            typesConfig.concat(otherTypes).map(t => t.getTypeName ? t.getTypeName() : t)
          ))
        })

        const writeableProperties = modelProperties || config.writeableProperties
        const others = otherPropertyNames.map(other => other.slice(0, 1).toUpperCase() + other.slice(1))
        const joinedOthersPropertyName = otherPropertyNames[0] +
            (others.length > 1 ? ('And' + others.slice(1).join('And')) : '')
        const joinedOthersClassName = others.join('And')
        const objectType = service.name + '_' + modelName

        const parentsTypes: string[] = Array.from(new Set(
          (config.parentsTypes || [])
            .concat(otherPossibleTypes.filter(x => !!x).flat()
        )))

        const context: AnyRelationContext = {
          annotation,
          service, app, model, originalModelProperties, modelProperties, modelPropertyName, modelRuntime,
          otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others,
          objectType, parentsTypes, otherPossibleTypes
        }

        cb(config, context)
      }
    }
  }
}

export function addAccessControlAnyParents(context) {
  const { modelRuntime } = context
  context.model.accessControlParents = context.model.accessControlParents ?? (async (what) => {
    const id = what.object
    console.log("PROPERTY OF ANY ACCESS CONTROL PARENTS", context.model.name, '/', id)
    const data = await modelRuntime().get(id)
    return context.otherPropertyNames.map(otherPropertyName => {
      const objectType = data[otherPropertyName + 'Type']
      const object = data[otherPropertyName]
      return { objectType, object }
    }).filter(parent => parent.object && parent.objectType)
  })
  context.model.accessControlParentsSource = context.model.accessControlParentsSource ?? context.otherPropertyNames.map(
    (otherPropertyName, index) => ({
      property: otherPropertyName,
      possibleTypes: context.otherPossibleTypes[index]
    })
  )
}

export function prepareAccessControl(accessControl, names) {
  if(typeof accessControl == 'object') {
    accessControl.objects = accessControl.objects ?? ((params) => names.map(name => ({
      objectType: params[name + 'Type'],
      object: params[name]
    })))
  }
}

export function cloneAndPrepareAccessControl(accessControl, names) {
  if(!accessControl) return accessControl
  if(Array.isArray(accessControl)) {
    accessControl = { roles: accessControl}
  }
  const newAccessControl = { ...accessControl }
  prepareAccessControl(newAccessControl, names)
  return newAccessControl
}

export function defineDeleteByOwnerEvents(config, context) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, modelPropertyName, otherPropertyNames, reverseRelationWord
  } = context
  for(const propertyName of otherPropertyNames) {
    const eventName = modelName + 'DeleteByOwner'
    service.events[eventName] = new EventDefinition({
      name: eventName,
      properties: {
        ownerType: {
          type: String,
          validation: ['nonEmpty']
        },
        owner: {
          type: String,
          validation: ['nonEmpty']
        }
      },
      async execute({ ownerType, owner }) {
        const runtime = modelRuntime()
        const tableName = runtime.tableName
        const prefix = JSON.stringify(ownerType) + ':' + JSON.stringify(owner)
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

export function defineParentDeleteTrigger(config, context) {
  registerParentDeleteTriggers(context, config)
}

export function defineAnyTypeIndexes(config, context, useId = false) {
  const { service, model } = context
  const tableName = service.name + '_' + model.name
  if(useId) { // don't use indexes - only object id's - good for propertyOfAny with one parent
    if(context.otherPossibleTypes[0]?.length) return // types defined in definition - no need for index
    model.indexes[context.otherPropertyNames[0]+'Types'] = {
      //property: [propertyName+'Type'],
      function:  async function(input, output, { tableName }) {
        const table = await input.table(tableName)
        await table.onChange(async (obj, oldObj) => {
          const id = obj?.id ?? oldObj?.id        
          const typeJson = id.slice(0, id.indexOf(':'))
          try {
            const type = JSON.parse(typeJson)
            const count = await table.count({ gte: typeJson+':', lte: type+'_\xFF\xFF\xFF\xFF', limit: 1 })
            if(count > 0) {
              await output.put({ id: type })
            } else {
              await output.delete({ id: type })
            }
          } catch(e) {
            console.debug("Error parsing typeJson", typeJson, e, 'in id', id, "from table", tableName)
            console.error("Error parsing typeJson", typeJson, e, 'in id', id, "from table", tableName)
          }
        })
      },
      parameters: { tableName: tableName, }
    }
    return
  }
  for(let i = 0; i < context.otherPropertyNames.length; i++) {
    const propertyName = context.otherPropertyNames[i]
    const propertyTypes = context.otherPossibleTypes[i]
    if(propertyTypes.length !== 0) continue // types defined in definition - no need for index
    const srcIndexName = 'by' + propertyName[0].toUpperCase() + propertyName.slice(1)
    if(!model.indexes[srcIndexName]) throw new Error("Parent index not defined: " + srcIndexName)
    model.indexes[propertyName+'Types'] = {
      //property: [propertyName+'Type'],
      function:  async function(input, output, { indexName }) {
        const index = await input.index(indexName)
        await index.onChange(async (obj, oldObj) => {
          const id = obj?.id ?? oldObj?.id
          const typeJson = id.slice(0, id.indexOf(':'))
          try {           
            const type = JSON.parse(typeJson)
            const count = await index.count({ gte: typeJson+':', lte: typeJson+'_\xFF\xFF\xFF\xFF', limit: 1 })
            if(count > 0) {
              await output.put({ id: type })
            } else {
              await output.delete({ id: type })
            }
          } catch(e) {
            output.debug("Error parsing typeJson", typeJson, e, 'in id', id, "from index", indexName)
            console.error("Error parsing typeJson", typeJson, e, 'in id', id, "from index", indexName)
          }
        })
      },
      parameters: { indexName: tableName + '_' + srcIndexName }
    }
  }
}
