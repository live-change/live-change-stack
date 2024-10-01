import { getCurrentInstance } from 'vue'

export function defaultData(definition, otherSrc) {
  if(!definition) return undefined
  let result = definition.defaultValue || definition.default || otherSrc
  if(definition.properties) {
    result = result || {}
    for(let name in definition.properties) {
      result[name] = defaultData(definition.properties[name], result?.[name])
    }
  } else if(definition.type === 'Array') {
    result = result || []
    for(let i = 0; i < result.length; i++) {
      result[i] = defaultData(definition.of, result[i])
    }
  }
  return result
}

export function validateData(definition, data, validationType = 'validation',
                             context = undefined, propName = '', props = data,
                             outputValidatorParams = false) {
  context = context || getCurrentInstance().appContext
  //console.log("VALIDATIE DATA", definition, data, validationType, context, propName, props)
  if(!context) throw new Error("No context")
  const validators = context.config.globalProperties.$validators
  const validationContext = { source: data, props, propName, definition, validators }
  if(!definition) return undefined
  const validations = definition[validationType]
  //console.log("VALIDATIONS!", validations)
  if(validations) {
    for(const validation of validations) {
      const validator = typeof validation == 'string'
        ? validators[validation]({}, validationContext)
        : validators[validation.name](validation, validationContext)
      if(!validator) throw new Error(`Validator ${validation.name || validation} not found`)
      const error = validator(data, context)
      if(error) {
        if(outputValidatorParams) {
          return { error, validator: validation.params }
        } else return error
      }
    }
  }
  if(!data) return undefined // No data, no errors, nonEmpty validator was already checked
  if(definition.properties) {
    const propertyErrors = {}
    for(let name in definition.properties) {
      const error = validateData(definition.properties[name], data?.[name], validationType, context,
        propName ? propName + '.' + name: name, props, outputValidatorParams)
      if(error) {
        if(error.propertyErrors) {
          for(let internalName in error.propertyErrors) {
            propertyErrors[name + '.' + internalName] = error.propertyErrors[internalName]
          }
        } else {
          propertyErrors[name] = error
        }
      }
    }
    if(Object.keys(propertyErrors).length > 0) return { propertyErrors }
  } else if(definition.type === 'Array') {
    const propertyErrors = {}
    for(let i = 0; i < data.length; i++) {
      const error = validateData(definition.of, data[i], validationType, context,
        propName ? propName + '.' + i : i, props, outputValidatorParams)
      const name = '' + i
      if(error) {
        if(error.propertyErrors) {
          for(let internalName in error.propertyErrors) {
            propertyErrors[name + '.' + internalName] = error.propertyErrors[internalName]
          }
        } else {
          propertyErrors[name] = error
        }
      }
    }
    if(Object.keys(propertyErrors).length > 0) return { propertyErrors }
  }
}
