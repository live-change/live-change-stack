<template>
  <div class="w-full lg:w-8 md:w-11">

<!--    <pre>{{ identifiers }}</pre>
    <pre>{{ modelDefinition.identifiers }}</pre>
    <pre>{{identifiersObject}}</pre>-->

    <div class="surface-card p-3 shadow-1 border-round">

      <ModelEditor :service="serviceName" :model="modelName" :identifiers="identifiersObject" draft
                   @created="handleCreated"/>

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
    identifiers: {
      type: Array,
      default: () => []
    },
    identifiersTypes: {
      type: Array,
      default: () => undefined
    },
    identifiersProperties: {
      type: Array,
      default: () => undefined
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

  import { useRouter } from 'vue-router'
  const router = useRouter()

  function handleCreated(id) {
    const newIdentifiers = modelDefinition.value.identifiers.map((identifier, i) => {
      if(typeof identifier === 'object' && identifier.field === 'id') {
        return id
      }
      return identifiers.value[i]
    })

    //console.log("newIdentifiers", newIdentifiers)
    if(JSON.stringify(identifiers.value) !== JSON.stringify(newIdentifiers)) {
      router.push({
        name: 'auto-form:editor',
        params: {
          serviceName: serviceName.value,
          modelName: modelName.value,
          identifiers: newIdentifiers
        }
      })
    }
  }

</script>

<style scoped>

</style>