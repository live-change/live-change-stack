import { validateData } from "@live-change/vue3-components"

export function propertiesValidationErrors(rootValue, identifiers, model, lastData, propertiesServerErrors, appContext) {
  const currentValue = {
    ...identifiers,
    ...rootValue,
  }

  console.log("propertiesValidationErrors", rootValue, identifiers, model, 
    lastData, propertiesServerErrors, appContext)

  const validationResult = validateData(model, currentValue, 'validation', appContext,
    '', rootValue, true)

  const softValidationResult = validateData(model, currentValue, 'softValidation', appContext,
    '', rootValue, true)

  const serverValidationResult = {}
  if(propertiesServerErrors) {
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