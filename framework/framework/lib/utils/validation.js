function getValidator(validation, context) {
  if(typeof validation == 'string') {
    let validator = context.service.validators[validation]
    if(!validator) throw new Error(`Validator ${validation} not found`)
    return validator({}, context)
  } else {
    let validator = context.service.validators[validation.name]
    if(!validator) throw new Error(`Validator ${validation.name} not found`)
    return validator(validation, context)
  }
}

function getValidators(source, service) {
  let validators = {}
  const context = { source, service, getValidator: validation => getValidator(validation, context) }
  for(let propName in source.properties) {
    const prop = source.properties[propName]
    if(prop.validation) {
      const validations = Array.isArray(prop.validation) ? prop.validation : [prop.validation]
      for(let validation of validations) {
        const validator = getValidator(validation, context)
        if(validators[propName]) validators[propName].push(validator)
          else validators[propName] = [validator]
      }
    }
    if(prop.type === Object) {
      validators = {
        ...validators,
        ...Object.fromEntries(
          Object.entries(getValidators(prop, service))
            .map(([key, value]) => [propName + '.' + key, value])
        )
      }
    }
    if(prop.type === Array) {
      const elementType = prop.of ?? prop.items
      if(elementType?.type === Object) {
        validators = {
          ...validators,
          ...Object.fromEntries(
            Object.entries(getValidators(prop, service))
              .map(([key, value]) => [propName + '.' + key, value])
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
  return validators
}

async function validate(props, validators, context) {
  //console.log("VALIDATE PROPS", props, "WITH", validators)
  let propPromises = {}
  for(let propName in validators) {
    let propValidators = validators[propName]
    const path = propName.split('.')
    function validateProperty(data, pathIndex, propNameAccumulator = '') {
      //console.log('  '.repeat(pathIndex), "VALIDATE PROPERTY", pathIndex, propNameAccumulator)
      if(pathIndex === path.length) {
        const promises = (propPromises[propNameAccumulator] || [])
        for(let validator of propValidators) {          
          promises.push(validator(data, { ...context, props, propName: propNameAccumulator }))
        }
        propPromises[propNameAccumulator] = promises
      } else {
        if(path[pathIndex] === '#') {
          for(let i = 0; i < data.length; i++) {
            validateProperty(data[i], pathIndex + 1, 
              propNameAccumulator + (propNameAccumulator ? '.' : '') + i)
          }
        } else {
          const deeper = data?.[path[pathIndex]] ?? null
          if(deeper === null) return
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
  console.log("PROP ERRORS", propErrors)
  if(Object.keys(propErrors).length > 0) throw { properties: propErrors }
}

export { getValidator, getValidators, validate }
