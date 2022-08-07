const App = require("@live-change/framework")
const { PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition } = App
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

function defineAnyIndexes(model, props) {
  const propCombinations = allCombinations(props)
  for(const propCombination of propCombinations) {
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

module.exports = {
  extractTypeAndIdParts, extractIdentifiersWithTypes, defineAnyProperties,
  defineAnyIndex, defineAnyIndexes,
  processModelsAnyAnnotation, generateAnyId,
  addAccessControlAnyParents
}
