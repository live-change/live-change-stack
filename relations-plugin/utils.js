const App = require("@live-change/framework")
const { PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition } = App

function extractIdParts(otherPropertyNames, properties) {
  const idParts = []
  for (const propertyName of otherPropertyNames) {
    idParts.push(properties[propertyName])
  }
  return idParts
}

function extractIdentifiers(otherPropertyNames, properties) {
  const identifiers = {}
  for (const propertyName of otherPropertyNames) {
    identifiers[propertyName] = properties[propertyName]
  }
  return identifiers
}

function generateId(otherPropertyNames, properties) {
  return otherPropertyNames.length > 1
      ? otherPropertyNames.map(p => JSON.stringify(properties[p])).join(':')
      : properties[otherPropertyNames[0]]
}

function extractObjectData(writeableProperties, properties, defaults) {
  let objectData = {}
  for (const propertyName of writeableProperties) {
    if (properties.hasOwnProperty(propertyName)) {
      objectData[propertyName] = properties[propertyName]
    }
  }
  return App.utils.mergeDeep({}, defaults, JSON.parse(JSON.stringify(objectData)))
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
  model.indexes['by' + what] = new IndexDefinition({
    property: props
  })
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

        const others = (Array.isArray(config.what) ? config.what : [config.what])
            .map(other => other.name ? other.name : other)

        const writeableProperties = modelProperties || config.writeableProperties
        //console.log("PPP", others)
        const otherPropertyNames = others.map(other => other.slice(0, 1).toLowerCase() + other.slice(1))
        const joinedOthersPropertyName = otherPropertyNames[0] +
            (others.length > 1 ? ('And' + others.slice(1).join('And')) : '')
        const joinedOthersClassName = others.join('And')

        const context = {
          service, app, model, originalModelProperties, modelProperties, modelPropertyName, defaults, modelRuntime,
          otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName,
          others, annotation
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

module.exports = {
  extractIdParts, extractIdentifiers, extractObjectData, defineProperties, defineIndex,
  processModelsAnnotation, generateId, addAccessControlParents
}
