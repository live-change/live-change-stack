<template>
  <div class="w-full lg:w-8 md:w-11">

    <ModelView :service="serviceName" :model="modelName" :identifiers="identifiersObject" />

  </div>
</template>

<script setup>

  import ModelView from "../components/crud/ModelView.vue"

  import { ref, computed, onMounted, defineProps, toRefs } from 'vue'

  const props = defineProps({
    serviceName: {
      type: String,
      required: true,
    },
    modelName: {
      type: String,
      required: true,
    },
    identifiers: {
      type: Array,
      default: []
    }
  })
  const { serviceName, modelName, identifiers } = toRefs(props)

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  const modelDefinition = computed(() => {
    const service = api.services[serviceName.value]
    if(!service) return null
    const model = service.models[modelName.value]
    if(!model) return null
    return model
  })

  const identifiersObject = computed(() => {
    const result = {}
    for(const [i, identifier] of Object.entries(identifiers.value)) {
      const identifierDefinition = modelDefinition.value.identifiers[i]
      if(typeof identifierDefinition === 'string') {
        result[identifierDefinition] = identifier
      } else {
        result[identifierDefinition.name] = identifier
      }
    }
    return result
  })

</script>

<style scoped>

</style>