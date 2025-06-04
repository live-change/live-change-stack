<template>
  <div class="w-full lg:w-8/12 md:w-11/12">

<!--    <pre>{{ identifiers }}</pre>
    <pre>{{ modelDefinition.identifiers }}</pre>
    <pre>{{identifiersObject}}</pre>-->

    <div class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border">

      <ModelEditor :service="serviceName" :model="modelName" :identifiers="identifiersObject" draft
                   @created="handleCreated" @saved="handleSaved" />

    </div>
  </div>
</template>

<script setup>

  import ModelEditor from "../components/crud/ModelEditor.vue"

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
    identifiersWithNames: {
      type: Array,
      default: () => []
    }
  })
  const { serviceName, modelName, identifiersWithNames } = toRefs(props)

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
    for(let i = 0; i < identifiersWithNames.value.length; i+=2) {
      const name = identifiersWithNames.value[i]
      const identifier = identifiersWithNames.value[i+1]
      result[name] = identifier
    }
    return result
  })

  import { useRouter } from 'vue-router'
  const router = useRouter()

  function handleCreated(id) {
    console.log("HANDLE CREATED", id)
    //console.log("newIdentifiers", newIdentifiers)
    router.push({
      name: 'auto-form:view',
      params: {
        serviceName: serviceName.value,
        modelName: modelName.value,
        id
      }
    })
    
  }

</script>

<style scoped>

</style>