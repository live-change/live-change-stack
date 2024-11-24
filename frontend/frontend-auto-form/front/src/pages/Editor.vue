<template>
  <div class="w-full lg:w-8 md:w-11">
    <div class="surface-card p-3 shadow-1 border-round">
      <div class="text-xl mb-2">
        Service <strong>{{ serviceName }} model {{ modelName }}</strong>
      </div>

      <h4>identifiers as object</h4>
      <pre>{{ identifiersObject }}</pre>

      <h4>definition</h4>
      <pre>{{ modelDefinition }}</pre>

    </div>
  </div>
</template>

<script setup>

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
        result[Object.keys(identifierDefinition)[0]] = identifier
      }
    }
    return result
  })


  import { editorData } from "@live-change/frontend-auto-form"

  /*const treeSettings = computedAsync(async () => {
    const ed = await editorData({
      service: serviceName,
      model: modelName,
      identifiers: { file: tree.value },
      draft: true,
      onCreated() {
        console.log("CREATED")
        // TODO: change route - add identifiers
      },
    })
    console.log("ED", ed)
    return ed
  })*/

</script>

<style scoped>

</style>