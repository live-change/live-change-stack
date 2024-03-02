import { getCurrentInstance } from 'vue'

function useHost(context) {
  context = context || getCurrentInstance().appContext
  return context.config.globalProperties.$host
}

export { useHost }
