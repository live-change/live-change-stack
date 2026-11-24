function propertyJson(propertyDef) {
  if (!propertyDef) return {}
  return propertyDef.toJSON ? propertyDef.toJSON() : propertyDef
}

function hasRequiredValidation(validation) {
  if (!validation) return false
  return validation.some(item => item === 'nonEmpty' || (typeof item === 'object' && item?.name === 'nonEmpty'))
}

export function schemaFromPropertyDefinition(propertyDef, app) {
  const definition = propertyJson(propertyDef)
  const type = definition.type

  if (type === 'Object' || definition.properties) {
    return {
      type: 'object',
      description: definition.description,
      properties: Object.fromEntries(
        Object.entries(definition.properties || {}).map(
          ([key, value]) => [key, schemaFromPropertyDefinition(value, app)]
        )
      )
    }
  }

  if (type === 'Array') {
    return {
      type: 'array',
      description: definition.description,
      items: schemaFromPropertyDefinition(definition.of || definition.items, app)
    }
  }

  if (type === 'String') {
    return {
      type: 'string',
      description: definition.description
    }
  }

  if (type === 'Number') {
    return {
      type: 'number',
      description: definition.description
    }
  }

  if (type === 'Boolean') {
    return {
      type: 'boolean',
      description: definition.description
    }
  }

  return {
    type: 'string',
    description: definition.description
  }
}

export function inputSchemaFromProperties(properties, app) {
  const schema = {
    type: 'object',
    properties: {}
  }
  const required = []

  for (const [name, prop] of Object.entries(properties || {})) {
    schema.properties[name] = schemaFromPropertyDefinition(prop, app)
    const propJson = propertyJson(prop)
    if (hasRequiredValidation(propJson.validation)) required.push(name)
  }

  if (required.length) schema.required = required
  return schema
}
