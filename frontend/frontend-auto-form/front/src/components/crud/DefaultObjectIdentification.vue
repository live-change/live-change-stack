<template>
  <template v-if="identificationParts.length > 0">
    <span>
      <i v-if="modelDefinition.icon" :class="[modelDefinition.icon, 'mr-2']" style="font-size: 0.9em;"></i>
      <template v-for="(part, index) in identificationParts">
        <i v-if="part.icon" :class="[part.icon, 'mr-2']" style="font-size: 0.9em;"></i>
        <span :class="{ 'mr-2': index < identificationParts.length - 1 }">
          <span v-if="part.isObject">
            <InjectedObjectIndentification :type="part.type" :object="objectData[part.field]" />
          </span>
          <span v-else-if="part.field">
            {{ objectData[part.field] }}
          </span>
          <span v-else>
            {{ part.text ?? '' }}
          </span>
        </span>
      </template>
    </span>
  </template>
  <template v-else>
    <span>      
      <strong>{{ objectType }}</strong>: {{ object ?? objectData?.to ?? objectData?.id }}
    </span>
  </template>
</template>

<script setup>

  import { ref, computed, onMounted, defineProps, defineEmits, toRefs, defineAsyncComponent } from 'vue'

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
    if(!objectType.value) return null
    const [service, model] = objectType.value.split('_')
    return { service, model }
  })
  const service = computed(() => serviceAndModel.value?.service)
  const model = computed(() => serviceAndModel.value?.model)

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

  function getDefinitionProperty(path) {
    const parts = path.split('.')
    let current = modelDefinition.value
    for(const part of parts) {
      if(part === '*') {
        return current?.items ?? current?.of
      } else {
        current = current?.properties?.[part]
      }
    }
    return current
  }

  const identificationParts = computed(() => {
    const config = identificationConfig.value
    if(!config) return []
    const configArray = Array.isArray(config) ? config : [config]
    return configArray.map(fieldConfig => {      
      if(typeof fieldConfig === 'string') {
        const field = getDefinitionProperty(fieldConfig)
        if(field) {
          const isObject = field.type.indexOf('_') > 0          
          return { field: fieldConfig, isObject, type: field.type }
        } else {
          return { text: fieldConfig }
        }
      } else if(typeof fieldConfig === 'object') {
        return fieldConfig
      } else {
        throw new Error('Unknown identification config: ' + JSON.stringify(fieldConfig))
      }
    })
  })

  const InjectedObjectIndentification = defineAsyncComponent(() => import('./InjectedObjectIndentification.vue'))

  const loadedObjectData = await live(objectDataPath)
  const objectData = computed(() => data.value || loadedObjectData.value)


  const icon = computed(() => {
    if(modelDefinition.value?.iconProperty) return objectData[modelDefinition.value?.iconProperty]
    return modelDefinition.value?.icon || 'pi pi-box'  
  })

</script>

<style scoped>

</style>