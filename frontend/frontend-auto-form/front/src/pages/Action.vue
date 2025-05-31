<template>
  <div class="w-full lg:w-8/12 md:w-11/12">
    <div class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border">

      <ActionForm 
        :service="serviceName" 
        :action="actionName"        
        :parameters="parameters"
        @done="handleDone"
      />

    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, defineProps, toRefs } from 'vue'
  import ActionForm from '../components/crud/ActionForm.vue'

  const props = defineProps({
    serviceName: {
      type: String,
      required: true
    },
    actionName: {
      type: String,
      required: true
    },
    parametersJson: {
      type: String
    }
  })
  const { serviceName, actionName, parametersJson } = toRefs(props)
  
  const parameters = computed(() => parametersJson.value ? JSON.parse(parametersJson.value) : {})

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  function handleDone(result) {
    console.log('Action executed:', result)
  }
</script>

<style scoped>
</style> 