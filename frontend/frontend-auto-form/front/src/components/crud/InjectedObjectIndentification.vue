<template>
  <router-link v-if="link" :to="linkPath">
    <ObjectIdentification
        :objectType="type"
        :object="object"
        :data="objectData"
        :inline="inline"
    />
  </router-link>
  <ObjectIdentification
    v-else
    :objectType="type"
    :object="object"
    :data="objectData"
    :inline="inline"
  />
</template>

<script setup>

  import { computed, defineProps, toRefs } from 'vue'
  import { injectComponent } from '@live-change/vue3-components'

  const props = defineProps({
    type: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      default: () => null
    },
    link: {
      type: String,
      default: 'view'
    },
    inline: {
      type: Boolean,
      default: false
    }
  })
  const { type, object, data, link, inline } = toRefs(props)

  import AutoObjectIdentification from './AutoObjectIdentification.vue'

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  const serviceAndModel = computed(() => {
    const [service, model] = type.value.split('_')
    return { service, model }
  })
  const service = computed(() => serviceAndModel.value.service)
  const model = computed(() => serviceAndModel.value.model)

  const ObjectIdentification = computed(() =>
    injectComponent({
      name: 'ObjectIdentification',
      type: type.value,
      service: service.value,
      model: model.value
    }, AutoObjectIdentification)
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

  const linkPath = computed(() => {
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