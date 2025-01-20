import { usePath, live, useApi } from '@live-change/vue3-ssr'
import { computed } from 'vue'

export default async function viewData(options) {
  if(!options) throw new Error('options must be provided')

  const {
    identifiers,
    service: serviceName,
    model: modelName,

    path = usePath(),
    api = useApi(),
  } = options

  if(!identifiers) throw new Error('identifiers must be defined')
  if(!serviceName || !modelName) throw new Error('service and model must be defined')

  const service = api.services[serviceName]
  const model = service.models[modelName]
  const {
    crudMethods = model.crud,
    identifiersNames = model.identifiers,
    //editableProperties = model.editableProperties ?? Object.keys(model.properties)
  } = options

  if(!crudMethods) throw new Error('crud methods must be defined in model or options')
  if(!identifiersNames) throw new Error('identifiers names must be defined in model or options')
//  if(!editableProperties) throw new Error('editableProperties must be defined in model or options')

  const savedDataPath = path[serviceName][crudMethods.read](identifiers)

  let data
  let error

  try {
    data = await live(savedDataPath)
  } catch(e) {
    console.log("VIEW DATA CATCH ERROR", e)
    error = computed(() => e) /// TODO: realtime error handling for access errors
    data = computed(() => null)
  }

  return { data, error }

}