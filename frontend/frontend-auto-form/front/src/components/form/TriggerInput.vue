<template>
  <div>
    <div ref="selectElement" class="p-select p-component p-inputwrapper w-full" @click="toggleObjectPicker">
      <span v-if="!(model?.name && model?.service)" class="p-select-label p-placeholder" tabindex="0" role="combobox">
        <span>
          Select trigger 
        </span>        
      </span>
      <span v-else class="p-select-label">
        <span>
          {{ model.service }} - {{ model.name }} 
        </span>
      </span>
      <div class="p-select-dropdown" data-pc-section="dropdown">
        <ChevronDownIcon />
      </div>
    </div>

    <!-- <pre>objt = {{ objectType }}</pre> -->

    <Popover ref="triggerPickerPopover" :pt="{
      root: {
        class: 'trigger-picker-popover overflow-y-auto',
        style: {
          minWidth: `${width}px`,
          maxHeight: `calc(50vh - 30px)`
        }
      }
    }">
      <TriggerPicker v-model="model" :definition="definition" :properties="properties"
                    :rootValue="rootValue" :propName="propName" :i18n="i18n" @selected="handleSelected" />
    </Popover>

    <!-- needed to autoload styles: -->
    <Select class="hidden" :options="[1,2,3]" />

    <AutoField v-if="triggerDefinition" v-model="triggerProperties"
               :definition="{ ...triggerDefinition, type: 'Object' }" 
               :rootValue="rootValue" :propName="propName+'.properties'"
               :i18n="i18n" label="trigger.properties" />

  </div>
</template>

<script setup>
  import ChevronDownIcon from '@primevue/icons/chevrondown'
  import Select from 'primevue/select'
  import Popover from 'primevue/popover'
  import TriggerPicker from './TriggerPicker.vue'

  import AutoField from './AutoField.vue'

  import { defineProps, defineEmits, toRefs, ref, defineModel, computed } from 'vue'
  import { useElementSize } from '@vueuse/core'

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
    }
  })

  const { definition, properties, rootValue, propName, i18n: i18nPrefix } = toRefs(props)

  const model = defineModel({
    required: true
  })

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  const triggerPickerPopover = ref()
  const selectElement = ref()
  const { width } = useElementSize(selectElement)

  const toggleObjectPicker = (event) => {
    triggerPickerPopover.value.toggle(event)
  }

  const handleSelected = (object) => {
    triggerPickerPopover.value.hide()
  }

  const triggerDefinition = computed(() => {
    if(!model.value?.service || !model.value?.name) return null
    const service = api.metadata.api.value.services.find(s => s.name === model.value.service)
    if(!service) return null
    return service.triggers[model.value.name][0]
  })

  const triggerProperties = computed({
    get() {
      return model.value?.properties
    },
    set(value) {
      model.value = { ...(model.value ?? {}), properties: value }
    }
  })

</script>

<style>
  .trigger-picker-popover {
    margin-top: 1px;
  }
  .trigger-picker-popover:before {
    display: none;
  }
  .trigger-picker-popover:after {
    display: none;
  }
</style>
