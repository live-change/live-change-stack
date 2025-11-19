<template>
  <div>
    <div>
      <div v-if="!(model?.service)" class="p-1 py-2 sticky top-0 z-10">
        <div class="flex flex-col gap-2">
    <!--       <label :for="`type-select-${uid}`">{{ t('objectPicker.selectObjectType') }}</label> -->
          <!-- <Select v-model="selectedService" :options="serviceOptions" :id="`service-select-${uid}`"
                  :placeholder="t('triggerPicker.selectService')" /> -->
          <div class="text-sm text-surface-600 dark:text-surface-400 mb-2">{{ t('triggerPicker.selectService') }}</div>
          <div class="flex flex-col gap-2">
            <div v-for="service in serviceOptions" :key="service"
                 class="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer"
                 @click="selectedService = service">
              {{ service }}
            </div>
          </div>        
        </div>
      </div>

      <div v-if="model?.service">
        <div class="text-sm text-surface-600 dark:text-surface-400 mb-2">
          {{ t('triggerPicker.selectedService') }} {{ model.service }}
          <Button class="ml-2" icon="pi pi-times" size="small" outlined rounded @click="selectedService = null" />
        </div>
        <div class="text-sm text-surface-600 dark:text-surface-400 mb-2">{{ t('triggerPicker.selectTrigger') }}</div>
        <div class="flex flex-col gap-2">
          <div v-for="trigger in triggerOptions" :key="trigger"
               class="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer"
               @click="selectedTrigger = trigger">
            {{ trigger }}
          </div>
        </div>
      </div>
    </div>


    <!-- <pre>isTypeNeeded = {{ isTypeNeeded }}</pre>
    <pre>typePropertyName = {{ typePropertyName }}</pre>
    <pre>typePropertyPath = {{ typePropertyPath }}</pre>
    <pre>typeModel = {{ typeModel }}</pre> -->
    <!-- <div>
      <pre>objectsPathRangeConfig = {{ objectsPathRangeConfig }}</pre>
      <pre>objectsPathRangeFunction = {{ objectsPathRangeFunction }}</pre>
      <pre>selectedType = {{ selectedType }}</pre>
      <pre>definition = {{ definition }}</pre>
      <pre>properties = {{ properties }}</pre>
      <pre>typeOptions = {{ typeOptions }}</pre>
      <pre>model = {{ model }}</pre>
    </div> -->
  </div>
</template>

<script setup>
  import Select from 'primevue/select'
  import Button from 'primevue/button'
  import AutoObjectIdentification from '../crud/DefaultObjectIdentification.vue'
  import { RangeViewer, injectComponent } from "@live-change/vue3-components"

  import { defineProps, defineEmits, toRefs, ref, defineModel, computed, useId, inject, unref } from 'vue'
  import pluralize from 'pluralize'

  const uid = useId()

  const props = defineProps({
    definition: {
      type: Object
    },
    properties: {
      type: Object,
      default: () => ({})
    },
    rootValue: {
      type: Object,
      default: () => ({})
    },
    propName: {
      type: String,
      default: ''
    },
    i18n: {
      type: String,
      default: ''
    },
    showServiceName: {
      type: Boolean,
      default: false
    },
    view: {
      type: String,
      default: 'range'
    } 
  })

  const { definition, properties, rootValue, propName, i18n, view } = toRefs(props)

  const model = defineModel({
    required: true
  })

  const emit = defineEmits(['selected'])

  import { useI18n } from 'vue-i18n'
  const { t: tI18n, te } = useI18n()
  const t = (key, ...params) => tI18n(
    te(i18n.value + propName.value + key) 
    ? i18n.value + propName.value + key 
    : key, ...params
  )

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()
  const serviceOptions = computed(() => {
    return api.metadata.api.value.services.map(s => s.name)
  })

  const selectedService = computed({
    get() {
      return model.value?.service
    },
    set(value) {
      model.value = { ...(model.value ?? {}), service: value }
    }
  })

  const triggerOptions = computed(() => {
    if(!selectedService.value) return []
    const service = api.metadata.api.value.services.find(s => s.name === selectedService.value)
    if(!service) return []
    return Object.keys(service.triggers)
  })

  const selectedTrigger = computed({
    get() {
      return model.value?.name
    },
    set(value) {
      model.value = { ...(model.value ?? {}), name: value }
      emit('selected', model.value)
    }
  })

</script>

<style scoped>
</style>