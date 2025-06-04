<template>
  <div class="w-full lg:w-8/12 md:w-11/12">

<!--    <pre>{{ identifiers }}</pre>
    <pre>{{ modelDefinition.identifiers }}</pre> -->
    <!-- <pre>{{identifiersObject}}</pre> -->

    <div class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border">

      <ModelEditor :service="serviceName" :model="modelName" :identifiers="identifiersObject" draft
                   @saved="handleSaved" />

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
    id: {
      type: String,
      required: true,
    }
  })
  const { serviceName, modelName, id } = toRefs(props)

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
    return {
      [modelName.value[0].toLowerCase() + modelName.value.slice(1)]: id.value
    }
  })

  import { useRouter } from 'vue-router'
  const router = useRouter()

  function handleSaved(result) {
    console.log("HANDLE SAVED", result)
    router.push({
      name: 'auto-form:view',
      params: {
        serviceName: serviceName.value,
        modelName: modelName.value,
        id: id.value
      }
    })
  }

</script>

<style scoped>

</style>