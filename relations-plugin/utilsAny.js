const App = require("@live-change/framework")
const app = App.app()
const {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition, TriggerDefinition
} = App
const { allCombinations } = require("./combinations.js")

function extractTypeAndIdParts(otherPropertyNames, properties) {
  const typeAndIdParts = []
  for (const propertyName of otherPropertyNames) {
    typeAndIdParts.push(properties[propertyName+'Type'])
    typeAndIdParts.push(properties[propertyName])
  }
  return typeAndIdParts
}

function extractIdentifiersWithTypes(otherPropertyNames, properties) {
  const identifiers = {}
  for (const propertyName of otherPropertyNames) {
    identifiers[propertyName] = properties[propertyName]
    identifiers[propertyName + 'Type'] = properties[propertyName + 'Type']
  }
  return identifiers
}

function generateAnyId(otherPropertyNames, properties) {
  console.log("GEN ID", otherPropertyNames, properties, '=>',
    otherPropertyNames
      .map(p => [p+'Type', p])
      .flat()
      .map(p => JSON.stringify(properties[p])).join(':'))

  return otherPropertyNames
      .map(p => [p+'Type', p])
      .flat()
      .map(p => JSON.stringify(properties[p])).join(':')
}

function defineAnyProperties(model, names) {
  const identifiers = {}
  for (let i = 0; i < names.length; i++) {
    identifiers[names[i]] = new PropertyDefinition({
      type: String,
      validation: ['nonEmpty']
    })
    identifiers[names[i]+'Type'] = new PropertyDefinition({
      type: String,
      validation: ['nonEmpty']
    })
  }
  for(const key in identifiers) {
    model.properties[key] = identifiers[key]
  }
  return identifiers
}

function defineAnyIndex(model, what, props) {
  model.indexes['by' + what] = new IndexDefinition({
    property: props.map(prop => [prop+'Type', prop]).flat()
  })
}

function defineAnyIndexes(model, props, fullIndex = true) {
  const propCombinations = allCombinations(props)
  for(const propCombination of propCombinations) {
    if(propCombination.length == props.length && !fullIndex) continue
    const upperCaseProps = propCombination.map(prop => prop[0].toUpperCase() + prop.slice(1))
    defineAnyIndex(model, upperCaseProps.join('And'), propCombination)
  }
}

function processModelsAnyAnnotation(service, app, annotation, multiple, cb) {
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
        if (typeof config == 'string' || Array.isArray(config)) config = {what: config}

        console.log("MODEL " + modelName + " IS " + annotation + " " + config.what)

        const otherPropertyNames = (Array.isArray(config.to) ? config.to : [config.to ?? 'owner'])
            .map(other => other.name ? other.name : other)

        const writeableProperties = modelProperties || config.writeableProperties
        const others = otherPropertyNames.map(other => other.slice(0, 1).toUpperCase() + other.slice(1))
        const joinedOthersPropertyName = otherPropertyNames[0] +
            (others.length > 1 ? ('And' + others.slice(1).join('And')) : '')
        const joinedOthersClassName = others.join('And')

        const context = {
          service, app, model, originalModelProperties, modelProperties, modelPropertyName, defaults, modelRuntime,
          otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
        }

        cb(config, context)
      }
    }
  }
}

function addAccessControlAnyParents(context) {
  const { modelRuntime } = context
  context.model.accessControlParents = async (id) => {
    const data = await modelRuntime().get(id)
    return context.otherPropertyNames.map(otherPropertyName => {
      const objectType = data[otherPropertyName + 'Type']
      const object = data[otherPropertyName]
      return { objectType, object }
    }).filter(parent => parent.object && parent.objectType)
  }
  context.model.accessControlParentsSource = context.otherPropertyNames.map(
    otherPropertyName => ({
      property: otherPropertyName
    })
  )
}

function prepareAccessControl(accessControl, names) {
  if(typeof accessControl == 'object') {
    accessControl.objects = accessControl.objects ?? ((params) => names.map(name => ({
      objectType: params[name + 'Type'],
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
        } while (bucket.length == bucketSize)
      }
    })
  }
}

function defineParentDeleteTrigger(config, context) {
  const {
    service, modelRuntime, modelPropertyName, identifiers,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model,
    reverseRelationWord
  } = context
  const triggerName = 'deleteObject'
  if(!service.triggers[triggerName]) service.triggers[triggerName] = []
  service.triggers[triggerName].push(new TriggerDefinition({
    name: triggerName,
    properties: {
      objectType: {
        type: String,
      },
      object: {
        type: String
      }
    },
    async execute({ objectType, object }, {client, service}, emit) {
      const tableName = modelRuntime().tableName
      const prefix = JSON.stringify(objectType) + ':' + JSON.stringify(object)
      const promises = otherPropertyNames.map(async (propertyName) => {
        const indexName = tableName + '_by' + propertyName[0].toUpperCase() + propertyName.slice(1)
        const bucketSize = 32
        let found = false
        let bucket
        do {
          bucket = await app.dao.get(['database', 'indexRange', app.databaseName, indexName, {
            gte: prefix + ':',
            lte: prefix + '_\xFF\xFF\xFF\xFF',
            limit: bucketSize
          }])
          if(bucket.length > 0) found = true
          const deleteTriggerPromises = bucket.map(({to}) => [
            service.trigger({
              type: 'delete'+service.name[0].toUpperCase()+service.name.slice(1)+'_'+modelName,
              objectType: service.name+'_'+modelName,
              object: to
            }),
            service.trigger({
              type: 'deleteObject',
              objectType: service.name+'_'+modelName,
              object: to
            })
          ]).flat()
          await Promise.all(deleteTriggerPromises)
        } while (bucket.length == bucketSize)
        if(found) {
          const eventName = propertyName + reverseRelationWord + modelName + 'DeleteByOwner'
          emit({
            type: eventName,
            ownerType: objectType,
            owner: object
          })
        }
      })
      await Promise.all(promises)
    }
  }))
}

module.exports = {
  extractTypeAndIdParts, extractIdentifiersWithTypes, defineAnyProperties,
  defineAnyIndex, defineAnyIndexes,
  processModelsAnyAnnotation, generateAnyId,
  addAccessControlAnyParents,
  prepareAccessControl,
  defineDeleteByOwnerEvents, defineParentDeleteTrigger
}
