import { validateData } from "@live-change/vue3-components"

export function propertiesValidationErrors(rootValue, parameters, definition, lastData, propertiesServerErrors, appContext) {
  const currentValue = {
    ...parameters,
    ...rootValue,
  }

  console.log("propertiesValidationErrors", rootValue, parameters, definition, 
    lastData, propertiesServerErrors, appContext)

  const validationResult = validateData(definition, currentValue, 'validation', appContext,
    '', rootValue, true)

  const softValidationResult = validateData(definition, currentValue, 'softValidation', appContext,
    '', rootValue, true)

  const serverValidationResult = {}
  if(propertiesServerErrors) {
    console.log("propertiesServerErrors", propertiesServerErrors, lastData, rootValue)
    for(const propPathString in propertiesServerErrors) {
      const propPath = propPathString.split('.')
      let last = lastData
      let current = rootValue
      for(const prop of propPath) {
        last = last?.[prop] ?? null
        current = current?.[prop] ?? null
      }          
      if(JSON.stringify(last) === JSON.stringify(current)) {
        serverValidationResult[propPathString] = propertiesServerErrors[propPathString]
      }
    }
  }

  console.log("currentValue", currentValue)
  console.log("validationResult", validationResult, softValidationResult)
  console.log("serverValidationResult", serverValidationResult)

  return {
    ...softValidationResult?.propertyErrors,
    ...validationResult?.propertyErrors,    
    ...serverValidationResult,
  }
  
}