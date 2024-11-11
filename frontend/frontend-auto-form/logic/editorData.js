import { useToast } from 'primevue/usetoast'
import { usePath, live, useApi } from '@live-change/vue3-ssr'

function editorData(options = {}) {
  let {
    service: serviceName,
    model: modelName,
    draft = false,
    methodNames = {}
  } = options
  if(!service || !model) throw new Error('service and model must be defined')

  const path = usePath()
  const api = useApi()
  const toast = useToast()

  const service = api.services[serviceName]
  const model = service.models[modelName]

}