import { sourceSymbol } from '@live-change/dao'
import { useApi } from '@live-change/vue3-ssr'
import { getCurrentInstance } from 'vue'


function mergeSchemas(s1, s2) {
  return {
    ...s1,
    ...s2,
    properties: {
      ...s1.properties,
      ...s2.properties
    }
  }
}

function addSchema(schemas, schema) {
  for(let i = 0; i < schemas.length; i++) {
    const s = schemas[i]
    if(s.modelName === schema.modelName && s.serviceName === schema.serviceName) {
      schemas[i] = mergeSchemas(s, schema)
      return
    }
  }
  schemas.push(schema)
}

export function schemaFromDefinition(definition, data, type, appContext = getCurrentInstance().appContext) {
  if(!type) type = definition.type
  if(type === 'Object') {
    const properties = Object.fromEntries(
      Object.entries(definition.properties).map(
        ([key, value]) => [key, schemaFromDefinition(value, data?.[key], undefined, appContext)])
    )
    for(const key in definition.properties) {
      const prop = definition.properties[key]
      if(key.endsWith('Type') && prop.type === 'type') {
        const keyWithoutType = key.slice(0, -4)
        properties[key] = {
          type: 'string',
          enum: prop.enum,
          enumDescriptions: prop.enumDescriptions,
          description: `Type of ${keyWithoutType}`,
        }
        properties[keyWithoutType] = {
          type: 'string',          
          description: `Id of Object with type defined in ${key}`,                
        }
      }
    }
    return {
      type: 'object',
      properties,
      description: definition.description,
    }      
  } else if(type === 'Array') {
    const schema = {
      type: 'array',        
      items: schemaFromDefinition(definition.items ?? definition.of, data?.[0], undefined, appContext),
      description: definition.description,
    }    
    if(data) {
      for(const item of data) {
        extendSchema(schema.items, item, schema.items.modelName, schema.items.serviceName) 
      }
    }
    return schema
  } else if(type === 'String') {
    return {
      type: 'string',
      description: definition.description,
      enum: definition.enum,
      enumDescriptions: definition.enumDescriptions
    }
  } else if(type === 'Number') {
    return {
      type: 'number',
      description: definition.description
    }
  } else if(type === 'Boolean') {
    return {
      type: 'boolean',
      description: definition.description
    }
  } else if(type === 'Date') {
    return {
      type: 'string',
      format: 'date-time',
      description: definition.description
    }
  } else if(type) {
    const api = useApi(appContext)
    const [serviceName, modelName] = definition.type.split('_')
    const serviceDefinition = api.getServiceDefinition(serviceName)
    const modelDefinition = serviceDefinition?.models?.[modelName]      
    if(!data || typeof data === 'string') {
      return {
        type: 'string',
        description: `Id of ${modelName} from ${serviceName} service.`
          + (modelDefinition?.description ? `\n${modelDefinition.description}` : '')
      }
    } else {
      const schema = schemaFromDefinition(modelDefinition, data, 'Object', appContext)
      schema.serviceName = serviceName
      schema.modelName = modelName
      schema.description = [
        `Object ${modelName} from ${serviceName} service.`,
        definition.description,schema.description
      ].filter(Boolean).join('\n')
      return schema
    }
  } else {
    console.log("UNHANDLED TYPE", definition)
  }
}

function extendSchema(schema, data, viewName, serviceName, appContext) {
  if(!data) return
  if(Array.isArray(data)) {
    if(!schema.items) {
      schema.items = generateSchema(data, schema, 'items', appContext)
    }
  } else {
    for(const property in data) {
      const value = data[property]
      if(!schema.properties[property]) { /// additional property
        if(property === 'id' || property === 'to') {
          schema.properties.id = {
            type: 'string',
            description: schema.modelName ? `Id of ${schema.modelName} from ${schema.serviceName} service.` : `Id.`
          }
        } else {
          generateSchema(value, schema.properties, property, appContext)
        }
      }
    }
  }
}

function generateSchema(data, schemaObject, schemaProperty, appContext) {
  const api = useApi(appContext)
  if(!schemaObject[schemaProperty]) {
    schemaObject[schemaProperty] = {
      anyOf: []
    }    
  }
  let schemas = schemaObject[schemaProperty].anyOf
  let viewDefinition = null
  if(data?.[sourceSymbol]) {
    const [serviceName, viewName] = data[sourceSymbol]
    const serviceDefinition = api.getServiceDefinition(serviceName)
    viewDefinition = serviceDefinition?.views?.[viewName]
  }
  if(viewDefinition) {
    //console.log("VIEW DEFINITION", viewDefinition)
    const schema = schemaFromDefinition(viewDefinition.returns, data, undefined, appContext)
    extendSchema(schema, data, undefined, undefined, appContext)
    addSchema(schemas, schema)
  } else {
    
  }
}

function cleanSchema(schema) {
  if(schema.anyOf && schema.anyOf.length === 1) {
    return cleanSchema(schema.anyOf[0])
  } else if(schema.type === 'object') {
    const cleanedProperties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, cleanSchema(value)])
    )
    return {
      ...schema,
      properties: cleanedProperties
    }
  } else if(schema.type === 'array') {
    return {
      type: 'array',
      items: cleanSchema(schema.items)
    }
  } else {  
    return schema
  }
}

export function getSchemaFromData(data, appContext = getCurrentInstance().appContext) {
  let schemaOutput = {}
  generateSchema(data, schemaOutput, 'schema', appContext)
  return cleanSchema(schemaOutput.schema)
}

export function cleanData(data) {
  if(typeof data !== 'object') return data
  if(Array.isArray(data)) {
    return data.map(cleanData)
  } else {
    const cleanedProperties = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, cleanData(value)])
    )
    if(data.to && data.id) {
      cleanedProperties.id = data.to
      delete cleanedProperties.to
    }
    return cleanedProperties
  }
}
