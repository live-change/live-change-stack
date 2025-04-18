import App from "@live-change/framework"
const app = App.app()
import { allCombinations } from "./combinations.js"
import {
  registerParentDeleteTriggers, registerParentCopyTriggers
} from "./changeTriggers.js"
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition, TriggerDefinition
} from "@live-change/framework"

export {
  extractObjectData, extractIdentifiers
} from './dataUtils.js'

import pluralize from 'pluralize'

export function extractIdParts(otherPropertyNames, properties) {
  const idParts = []
  for (const propertyName of otherPropertyNames) {
    idParts.push(properties[propertyName])
  }
  return idParts
}


export function generateId(otherPropertyNames, properties) {
  return otherPropertyNames.length > 1
      ? otherPropertyNames.map(p => JSON.stringify(properties[p])).join(':')
      : properties[otherPropertyNames[0]]
}

export function defineProperties(model, types, names) {
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

export function defineIndex(model, what, props, multi = undefined) {
  console.log("DEFINE INDEX", model.name, what, props)
  model.indexes['by' + what] = new IndexDefinition({
    property: props,
    multi
  })
}
export function defineIndexes(model, props, types) {
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

export function processModelsAnnotation(service, app, annotation, multiple, cb) {
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

        const context = {
          service, app, model, originalModelProperties, modelProperties, modelPropertyName, modelRuntime,
          otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName,
          others, annotation, objectType, parentsTypes: others
        }

        cb(config, context)
      }
    }
  }
}

export function addAccessControlParents(context) {
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

export function prepareAccessControl(accessControl, names, types) {
  if(typeof accessControl == 'object') {
    accessControl.objects = accessControl.objects ?? ((params) => names.map((name, index) => ({
      objectType: types[index],
      object: params[name]
    })))
    accessControl.objParams = { names, types }
  }
}

export function cloneAndPrepareAccessControl(accessControl, names, types) {
  if(!accessControl) return accessControl
  if(Array.isArray(accessControl)) {
    accessControl = { roles: accessControl}
  }
  const newAccessControl = { ...accessControl }
  prepareAccessControl(newAccessControl, names, types)
  return newAccessControl
}

export function defineDeleteByOwnerEvents(config, context, generateId) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, modelPropertyName, otherPropertyNames, reverseRelationWord
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

export function defineParentDeleteTriggers(config, context) {
  registerParentDeleteTriggers(context, config)
}

export function defineParentCopyTriggers(config, context) {
  registerParentCopyTriggers(context, config)
}

export function includeAccessRoles(model, access) {
  if(!access) return
  if(!model.accessRoles) model.accessRoles = []
  if(typeof access === 'string' && !model.accessRoles.find(role => role === access)) {
    model.accessRoles.push(access)
  }
  if(Array.isArray(access)) {
    for(const element of access) {
      includeAccessRoles(model, element)
    }
  }
  if(access.roles) {
    includeAccessRoles(model, access.roles)
  }
}

export function defineGlobalRangeView(config, context, external = true) {
  const { service, modelRuntime, modelPropertyName, modelName, model } = context
  const viewName = (config.prefix || '' ) + pluralize(config.prefix ? modelName : modelPropertyName) + (config.suffix || '')
  if(external) model.crud.range = viewName
  service.views[viewName] = new ViewDefinition({
    name: viewName,
    properties: {
      ...App.utils.rangeProperties
    },
    returns: {
      type: Array,
      of: {
        type: model
      }
    },
    internal: !external,
    global: config.globalView,
    access: external && config.readAllAccess,
    daoPath(properties, { client, context }) {
      const range = App.extractRange(properties)
      const path = modelRuntime().rangePath(range)
      return path
    }
  })
}