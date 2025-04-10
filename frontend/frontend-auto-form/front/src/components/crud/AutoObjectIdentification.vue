<template>
  <template v-if="typeof identificationConfig === 'string'">
    <span>
      <i class="pi pi-box mr-2" style="font-size: 0.9em;"></i>{{ objectData[identificationConfig] }}
    </span>    
  </template>
  <template v-else>
    <span>      
      <strong>{{ objectType }}</strong>: {{ object ?? objectData.to ?? objectData.id }}
    </span>
  </template>
</template>

<script setup>

  import { ref, computed, onMounted, defineProps, defineEmits, toRefs } from 'vue'

  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      default: null
    },
    inline: {
      type: Boolean,
      default: false
    }
  })
  const { objectType, object, data, inline } = toRefs(props)

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  const serviceAndModel = computed(() => {
    const [service, model] = objectType.value.split('_')
    return { service, model }
  })
  const service = computed(() => serviceAndModel.value.service)
  const model = computed(() => serviceAndModel.value.model)

  const modelDefinition = computed(() => {
    return api.services?.[service.value]?.models?.[model.value]
  })

  const identificationViewName = computed(() => {
    return modelDefinition.value?.crud?.identification || modelDefinition.value?.crud?.read
  })

  const identificationConfig = computed(() => {
    return modelDefinition.value?.identification
  })

  const objectDataPath = computed(() => {
    if(data.value) return null
    if(!identificationConfig.value) return null
    const viewName = identificationViewName.value
    if(!viewName) return null
    const modelName = model.value
    return path[service.value][viewName]({
      [modelName[0].toLowerCase() + modelName.slice(1)]: object.value
    })
  })

  const loadedObjectData = await live(objectDataPath)
  const objectData = computed(() => data.value || loadedObjectData.value)


</script>

<style scoped>

</style>