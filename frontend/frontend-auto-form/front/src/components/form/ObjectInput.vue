<template>
  <div>
    <div ref="selectElement" class="p-select p-component p-inputwrapper w-full" @click="toggleObjectPicker">
      <span v-if="!model" class="p-select-label p-placeholder" tabindex="0" role="combobox">
        <span v-if="isTypeSelectable">
          Select object 
        </span>
        <span v-else>
          Select {{ objectModel }}
        </span>
      </span>
      <span v-else class="p-select-label">
        <ObjectIdentification
          :objectType="objectType"
          :object="model"
          class=""
        />
      </span>
      <div class="p-select-dropdown" data-pc-section="dropdown">
        <ChevronDownIcon />
      </div>
    </div>

    <!-- <pre>objt = {{ objectType }}</pre> -->

    <Popover ref="objectPickerPopover" :pt="{
      root: {
        class: 'object-picker-popover overflow-y-auto',
        style: {
          minWidth: `${width}px`,
          maxHeight: `calc(50vh - 30px)`
        }
      }
    }">
      <ObjectPicker v-model="model" :definition="definition" :properties="properties"
                    :rootValue="rootValue" :propName="propName" :i18n="i18n" @selected="handleSelected" />
    </Popover>

    <!-- needed to autoload styles: -->
    <Select class="hidden" :options="[1,2,3]" />

  </div>
</template>

<script setup>
  import ChevronDownIcon from '@primevue/icons/chevrondown'
  import Select from 'primevue/select'
  import Popover from 'primevue/popover'
  import ObjectPicker from './ObjectPicker.vue'
  import AutoObjectIdentification from '../crud/AutoObjectIdentification.vue'
  import { injectComponent } from "@live-change/vue3-components"

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
  
  const isTypeSelectable = computed(() => {
    return definition.value.type === 'any'
  })

  const objectType = computed(() => {    
      if(definition.value.type !== 'any') {
        return definition.value.type
      }
    const typePropertyName = props.propName + 'Type'    
    const typePropertyPath = typePropertyName.split('.')  
    return typePropertyPath.reduce((acc, prop) => acc?.[prop], rootValue.value)
  })

  const objectModel = computed(() => {
    const type = objectType.value
    if(!type) return null
    const [service, model] = type.split('_')
    return model
  })

  const ObjectIdentification = computed(() => {
    const type = objectType.value
    if(!type) return AutoObjectIdentification
    const [service, model] = type.split('_')
    return injectComponent({
      name: 'ObjectIdentification',
      type,
      service: service,
      model: model
    }, AutoObjectIdentification)
  })

  const objectPickerPopover = ref()
  const selectElement = ref()
  const { width } = useElementSize(selectElement)

  const toggleObjectPicker = (event) => {
    objectPickerPopover.value.toggle(event)
  }

  const handleSelected = (object) => {
    objectPickerPopover.value.hide()
  }

</script>

<style>
  .object-picker-popover {
    margin-top: 1px;
  }
  .object-picker-popover:before {
    display: none;
  }

  .object-picker-popover:after {
    display: none;
  }
</style>
