import { getCurrentInstance } from 'vue'

function useResponse(data, context) {
  context = context || getCurrentInstance().appContext
  if(data && context.config.globalProperties.$response) {
    if(data.status) {
      context.config.globalProperties.$response.status = data.status
    }
    if(data.headers) {
      for(const header in data.headers)
      context.config.globalProperties.$response.headers[header] = data.headers[header]
    }
  }
  return context.config.globalProperties.$response || { headers: {} }
}

export { useResponse }
