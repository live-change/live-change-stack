import App from "@live-change/framework"
const app = App.app()
import { allCombinations } from "./combinations.js"
import {
  fireChangeTriggers, registerParentDeleteTriggers, registerParentCopyTriggers
} from "./changeTriggers.js"
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition, TriggerDefinition
} from "@live-change/framework"

import {
  extractObjectData, extractIdentifiers
} from './dataUtils.js'

function extractIdParts(otherPropertyNames, properties) {
  const idParts = []
  for (const propertyName of otherPropertyNames) {
    idParts.push(properties[propertyName])
  }
  return idParts
}


function generateId(otherPropertyNames, properties) {
  return otherPropertyNames.length > 1
      ? otherPropertyNames.map(p => JSON.stringify(properties[p])).join(':')
      : properties[otherPropertyNames[0]]
}

function defineProperties(model, types, names) {
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

function defineIndex(model, what, props) {
  console.log("DEFINE INDEX", model.name, what, props)
  model.indexes['by' + what] = new IndexDefinition({
    property: props
  })
}
function defineIndexes(model, props, types) {
  console.log("DEFINE INDEXES", model.name, props, types)
  const propCombinations = allCombinations(Object.keys(props))
  for(const propCombination of propCombinations) {
    const upperCaseProps = propCombination.map(id => {
      const prop = props[id]
      return prop[0].toUpperCase() + prop.slice(1)
    })
    defineIndex(model, upperCaseProps.join('And'), props[propCombination])
  }
}

function processModelsAnnotation(service, app, annotation, multiple, cb) {
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
      const defaults = App.utils.generateDefault(originalModelProperties)

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

        console.log("MODEL " + modelName + " IS " + annotation + " " + config.what)

        const what = (Array.isArray(config.what) ? config.what : [config.what])
        const others = what.map(other => other.getTypeName ? other.getTypeName() : (other.name ? other.name : other))

        const writeableProperties = modelProperties || config.writeableProperties
        const otherNames = what.map(other => other.name ? other.name : other)
        const otherPropertyNames = otherNames.map(name => name[0].toLowerCase() + name.slice(1))

        const joinedOthersPropertyName = (otherNames[0][0].toLowerCase() + otherNames[0].slice(1)) +
            (otherNames.length > 1 ? ('And' + otherNames.slice(1).join('And')) : '')
        const joinedOthersClassName = otherNames.join('And')
        const objectType = service.name + '_' + modelName

        const context = {
          service, app, model, originalModelProperties, modelProperties, modelPropertyName, defaults, modelRuntime,
          otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName,
          others, annotation, objectType, parentsTypes: others
        }

        cb(config, context)
      }
    }
  }
}

function addAccessControlParents(context) {
  const { modelRuntime } = context
  context.model.accessControlParents = async (id) => {
    const data = await modelRuntime().get(id)
    return context.otherPropertyNames.map(otherPropertyName => {
      const objectType = (otherPropertyName.slice(0, 1).toUpperCase() + otherPropertyName.slice(1))
      const object = data[otherPropertyName]
      return { objectType, object }
    }).filter(parent => parent.object && parent.objectType)
  }
  context.model.accessControlParentsSource = context.otherPropertyNames.map(
    otherPropertyName => ({
      property: otherPropertyName,
      type: (otherPropertyName.slice(0, 1).toUpperCase() + otherPropertyName.slice(1))
    })
  )
}

function prepareAccessControl(accessControl, names, types) {
  if(typeof accessControl == 'object') {
    accessControl.objects = accessControl.objects ?? ((params) => names.map((name, index) => ({
      objectType: types[index],
      object: params[name]
    })))
  }
}

function defineDeleteByOwnerEvents(config, context, generateId) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, modelPropertyName, otherPropertyNames, reverseRelationWord
  } = context
  for(const propertyName of otherPropertyNames) {
    const eventName = propertyName + reverseRelationWord + modelName + 'DeleteByOwner'
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
        } while (bucket.length == bucketSize)
      }
    })
  }
}

function defineParentDeleteTriggers(config, context) {
  registerParentDeleteTriggers(context, config)
}

function defineParentCopyTriggers(config, context) {
  registerParentCopyTriggers(context, config)
}


export {
  extractIdParts, extractIdentifiers, extractObjectData, defineProperties, defineIndex, defineIndexes,
  processModelsAnnotation, generateId, addAccessControlParents, prepareAccessControl,
  defineDeleteByOwnerEvents, defineParentDeleteTriggers, defineParentCopyTriggers,
}
