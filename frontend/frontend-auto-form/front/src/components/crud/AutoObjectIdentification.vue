<template>
  <router-link v-if="link" :to="viewRoute">
    <ObjectIdentification :objectType="objectType" :object="object" :data="data" />
  </router-link>
  <ObjectIdentification v-else :objectType="objectType" :object="object" :data="data" />
</template>

<script setup>

  import { defineProps, computed, inject, toRefs } from 'vue'
  import { injectComponent } from '@live-change/vue3-components'

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
    },
    link: {
      type: Boolean,
      default: false
    }
  })
  const { objectType, object, data, link } = toRefs(props)

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  const serviceAndModel = computed(() => {
    const [service, model] = objectType.value.split('_')
    return { service, model }
  })
  const service = computed(() => serviceAndModel.value.service)
  const model = computed(() => serviceAndModel.value.model)

  import DefaultObjectIdentification from './DefaultObjectIdentification.vue'
  const ObjectIdentification = computed(() =>
    injectComponent({
      name: 'ObjectIdentification',
      type: service.value + '_' + model.value,
      service: service.value,
      model: model.value
    }, DefaultObjectIdentification)
  )

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

  function objectIdentifiers(object) {
    const identifiers = {}
    for(const identifierDefinition of modelDefinition.value.identifiers) {
      if(typeof identifierDefinition === 'string') {
        identifiers[identifierDefinition] = object[identifierDefinition]
      } else {
        if(identifierDefinition.field === 'id') {
          identifiers[identifierDefinition.name] = object?.to ?? object.id
        } else {
          identifiers[identifierDefinition.name] = object[identifierDefinition.field]
        }
      }
    }
    return identifiers
  }

  const viewRoute = computed(() => {  
    return {
      name: 'auto-form:view',
      params: {
        serviceName: service.value,
        modelName: model.value,
        identifiers: Object.values(objectIdentifiers(objectData.value))
      }
    }
  })


</script>


