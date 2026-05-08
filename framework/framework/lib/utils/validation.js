function getValidator(validation, context) {
  if(typeof validation == 'string') {
    let validator = context.service.validators[validation]
    if(!validator) throw new Error(`Validator ${validation} not found in service ${context.service.name}`)
    return validator({}, context)
  } else {
    let validator = context.service.validators[validation.name]
    if(!validator) throw new Error(`Validator ${validation.name} not found in service ${context.service.name}`)
    return validator(validation, context)
  }
}

function readIfFunction(definition) {
  if(!definition?.if) return null
  if(!definition.if.function) {
    throw new Error('Unknown if type ' + JSON.stringify(definition.if))
  }
  return definition.if.function
}

function getValidators(source, service) {
  let validators = {}
  let ifConditions = {}
  const context = { source, service, getValidator: validation => getValidator(validation, context) }
  for(let propName in source.properties) {
    const prop = source.properties[propName]
    const ifCondition = readIfFunction(prop)
    if(ifCondition) ifConditions[propName] = prop
    if(prop.validation) {
      const validations = Array.isArray(prop.validation) ? prop.validation : [prop.validation]
      for(let validation of validations) {
        const validator = getValidator(validation, context)
        if(validators[propName]) validators[propName].push(validator)
          else validators[propName] = [validator]
      }
    }
    if(prop.type === Object) {
      const nestedValidators = getValidators(prop, service)
      validators = {
        ...validators,
        ...Object.fromEntries(
          Object.entries(nestedValidators)
            .map(([key, value]) => [propName + '.' + key, value])
        )
      }
      const nestedIfConditions = nestedValidators._ifConditions || {}
      ifConditions = {
        ...ifConditions,
        ...Object.fromEntries(
          Object.entries(nestedIfConditions).map(([key, value]) => [propName + '.' + key, value])
        )
      }
    }
    if(prop.type === Array) {
      const elementType = prop.of ?? prop.items
      if(elementType?.type === Object) {
        const nestedValidators = getValidators(prop, service)
        validators = {
          ...validators,
          ...Object.fromEntries(
            Object.entries(nestedValidators)
              .map(([key, value]) => [propName + '.' + key, value])
          )
        }
        const nestedIfConditions = nestedValidators._ifConditions || {}
        ifConditions = {
          ...ifConditions,
          ...Object.fromEntries(
            Object.entries(nestedIfConditions).map(([key, value]) => [propName + '.' + key, value])
          )
        }
      } 
      if(elementType?.validation) {  
        validators[propName + '.#'] = validators[propName + '.#'] || []
        for(let validation of elementType.validation) {
          validators[propName + '.#'].push(getValidator(validation, context))            
        }
      }
    }
  }
  Object.defineProperty(validators, '_ifConditions', {
    value: ifConditions,
    enumerable: false
  })
  return validators
}

function evaluateIfCondition(definition, props, propName) {
  const condition = eval(`(${definition.if.function})`)
  return condition({ source: definition, props, propName })
}

function shouldSkipByIf(schemaPath, realPath, ifConditions, props) {
  const schemaParts = schemaPath.split('.')
  const realParts = realPath.split('.')
  for(let i = 1; i <= schemaParts.length; i++) {
    const prefix = schemaParts.slice(0, i).join('.')
    const definition = ifConditions[prefix]
    if(!definition) continue
    const realPrefix = realParts.slice(0, i).join('.')
    const visible = evaluateIfCondition(definition, props, realPrefix)
    if(!visible) return true
  }
  return false
}

async function validate(props, validators, context) {
  //console.log("VALIDATE PROPS", props, "WITH", validators)
  const ifConditions = validators?._ifConditions || {}
  let propPromises = {}
  for(let propName in validators) {
    let propValidators = validators[propName]
    const path = propName.split('.')
    function validateProperty(data, pathIndex, propNameAccumulator = '') {
      //console.log('  '.repeat(pathIndex), "VALIDATE PROPERTY", pathIndex, propNameAccumulator)
      if(pathIndex === path.length) {
        if(shouldSkipByIf(propName, propNameAccumulator, ifConditions, props)) return
        const promises = (propPromises[propNameAccumulator] || [])
        for(let validator of propValidators) {          
          promises.push(validator(data, { ...context, props, propName: propNameAccumulator }))
        }
        propPromises[propNameAccumulator] = promises
      } else {
        if(data === null || data === undefined) return
        if(path[pathIndex] === '#') {
          for(let i = 0; i < data.length; i++) {
            validateProperty(data[i], pathIndex + 1, 
              propNameAccumulator + (propNameAccumulator ? '.' : '') + i)
          }
        } else {
          const deeper = data?.[path[pathIndex]]
          validateProperty(deeper, pathIndex + 1, 
            propNameAccumulator + (propNameAccumulator ? '.' : '') + path[pathIndex])
        }
      }
    }
    validateProperty(props, 0)
  }
  let propErrors = {}
  for(const [propName, promises] of Object.entries(propPromises)) {
    let errors = (await Promise.all(promises)).filter(x=> !!x)
    if(errors.length > 0) {
      propErrors[propName] = errors[0]
    }
  }
  //console.log("PROP ERRORS", propErrors)
  if(Object.keys(propErrors).length > 0) throw { properties: propErrors }
}

export { getValidator, getValidators, validate }
