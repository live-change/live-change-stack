import ModelDefinition from '../definition/ModelDefinition.js'

function getModelName(t) {
  let modelName = null
  if(t instanceof ModelDefinition) {
    modelName = t.name
  }
  if(t instanceof String) {
    modelName = t
  }
  return modelName
}

async function preFilterParameters(parameters, definition) {
  if(!definition) return parameters
  let out = {}
  for(let propName in parameters) {
    let prop = definition[propName]
    out[propName] = (prop && prop.preFilter) ? prop.preFilter(parameters[propName]) : parameters[propName]
  }
  return out
}

async function prepareParameter(parameter, prop, service) {
  if(prop.type === Object) {
    if(!parameter) return null
    return await prepareParameters(parameter, prop.properties)
  }
  if(prop.type === Array) {
    if(!parameter) return parameter
    if(!(prop.of || prop.items)) return parameter
    return await Promise.all(parameter.map(item => prepareParameter(item, (prop.of || prop.items), service)))
  }
  if(prop.type === Date && parameter) {
    return new Date(parameter)
  }
  let modelName = getModelName(prop.type)
  if(modelName) {
    let model = service.models[modelName]
    if(model) {
      if(prop.fetch) return model.get(parameter)
      //console.log("CREATE ENTITY", parameter)
      return parameter
    }
  }
  if(prop.default && typeof parameter === 'undefined') {
    return prop.default
  }
  return parameter
}

async function prepareParameters(parameters, definition, service) {
  if(!definition) return parameters
  let out = {}
  for(let propName in parameters) {
    let prop = definition[propName]
    out[propName] = prop ? await prepareParameter(parameters[propName], prop, service) : parameters[propName]
    //console.log("PREP PROP", propName, prop, parameters[propName], out[propName])
  }
  for(let propName in definition) {
    let prop = definition[propName]
    if(prop.default && typeof out[propName] === 'undefined') {
      out[propName] = prop.default
    }
  }
  return out
}

async function processReturns(data, definition, service) {
  let out = {}
  for(let propName in definition) {
    let prop = definition[propName]
    out[propName] = await processReturn(data[propName], prop, service)
  }
  return out
}

async function processReturn(data, definition, service) {
  if(!definition) return data
  if(definition.type === Object && definition.properties) {
    return processReturns(data, definition.properties, service)
  }
  if(definition.type === Array) {
    return data.map(item => processReturn(item, definition.of, service))
  }
  let modelName = getModelName(definition.type)
  if(modelName) {
    let model = service.models[modelName]
    if(model) {
      if (!data) {
        if (definition.optional) return null
        throw new Error("Return data " + data + " is not " + model.definition.name + "!")
      }
/*      if (definition.idOnly) return data.id || data
      if (!(data instanceof Entity)) {
        if (typeof data != "string")
          throw new Error("Return data " + data + " is not " + model.definition.name + " id!")
        data = await model.get(data)
      }
      return await data.get()*/
    }
  }
  return data
}

export {
  processReturn,
  prepareParameters,
  preFilterParameters
}