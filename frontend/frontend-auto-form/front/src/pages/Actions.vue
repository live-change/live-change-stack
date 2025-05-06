<template>
  <div class="w-full lg:w-8/12 md:w-11/12">
    <div v-for="serviceWithActions of editableActionsByService"
         class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border">
      <div class="text-xl mb-2">
        Service <strong>{{ serviceWithActions.name }}</strong>
      </div>
      <div v-for="action of serviceWithActions.actions" class="mb-2 ml-4">
        <div class="mb-1 flex flex-row flex-wrap items-center justify-between">
          <div class="text-xl flex flex-row items-center mr-6">
            <strong>{{ action.name }}</strong>
            <span class="mx-1">action</span>
          </div>
          <div class="mt-2 md:mt-0">
            <router-link :to="actionRoute(serviceWithActions.name, action)" class="no-underline">
              <Button icon="pi pi-play" severity="success" :label="'Execute '+action.name" />
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, defineProps, toRefs } from 'vue'
  import Button from 'primevue/button'

  const props = defineProps({
    serviceName: {
      type: String,
      default: undefined
    },
  })
  const { serviceName } = toRefs(props)

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  const editableActionsByService = computed(() => {
    const results = []
    for(const [currentServiceName, service] of Object.entries(api.services)) {
      if(serviceName.value && currentServiceName !== serviceName.value) continue
      const actions = Object.entries(service.actions || {})
        .filter(([_, action]) => action.autoForm !== false)
        .map(([name, action]) => ({
          name,
          action
        }))
      if(actions.length === 0) continue
      const result = {
        name: currentServiceName,
        actions
      }
      results.push(result)
    }
    return results
  })

  function actionRoute(serviceName, action) {
    return {
      name: 'auto-form:action',
      params: {
        serviceName,
        actionName: action.name
      }
    }
  }
</script>

<style scoped>
</style> 