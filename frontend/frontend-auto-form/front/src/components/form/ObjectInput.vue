<template>
  <div>
    <div ref="selectElement" class="p-select p-component p-inputwrapper w-full" @click="toggleObjectPicker">
      <span class="p-select-label p-placeholder" tabindex="0" role="combobox">
        Select object
      </span>
      <div class="p-select-dropdown" data-pc-section="dropdown">
        <ChevronDownIcon />
      </div>
    </div>

    <Popover ref="objectPickerPopover" :pt="{
      root: {
        class: 'object-picker-popover overflow-y-auto',
        style: {
          minWidth: `${width}px`,
          maxHeight: `calc(50vh - 30px)`
        }
      }
    }">
      <ObjectPicker />
    </Popover>

    <!-- needed to autoload styles: -->
    <Select class="hidden" />
  </div>
</template>

<script setup>
  import ChevronDownIcon from '@primevue/icons/chevrondown'
  import Select from 'primevue/select'
  import Popover from 'primevue/popover'
  import ObjectPicker from './ObjectPicker.vue'

  import { defineProps, defineEmits, toRefs, ref, defineModel } from 'vue'
  import { useElementSize } from '@vueuse/core'

  const props = defineProps({
    definition: {
      type: Object
    },
    properties: {
      type: Object,
      default: () => ({})
    }
  })

  const model = defineModel({
    required: true
  })

  const { value, definition, modelValue } = toRefs(props)

  const objectPickerPopover = ref()
  const selectElement = ref()
  const { width } = useElementSize(selectElement)

  const toggleObjectPicker = (event) => {
    objectPickerPopover.value.toggle(event)
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
