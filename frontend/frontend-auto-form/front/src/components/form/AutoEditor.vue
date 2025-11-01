<template>
  <div v-if="definition" class="grid grid-cols-12 gap-4 formgrid p-fluid mt-2 mb-2">
    <auto-field v-for="property in propertiesList" :key="property"
                :modelValue="modelValue?.[property]"
                @update:modelValue="value => updateModelProperty(property, value)"
                :definition="definition.properties[property]"
                :label="property"
                :rootValue="props.rootValue" :errors="props.errors"
                :propName="(propName ? propName + '.' : '') + property"
                :i18n="i18n"                
                class="col-span-12" />
  </div>
</template>

<script setup>
  import AutoField from "./AutoField.vue"

  import { computed, inject, getCurrentInstance, toRefs } from 'vue'

  const props = defineProps({
    modelValue: {},
    definition: {
      type: Object
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
    editableProperties: {
      type: Array,
      items: {
        type: String
      }
    },
    errors: {
      type: Object,
      default: () => ({})
    }
  })

  const { modelValue, definition, propName, editableProperties, errors } = toRefs(props)

  const emit = defineEmits(['update:modelValue'])

  const propertiesList = computed(() => {
    if(editableProperties.value) return editableProperties.value
    if(props.definition.editableProperties) return props.definition.editableProperties
    if(!props.definition) return []
    if(!props.definition.properties) return []
    return Object.keys(props.definition.properties).filter(key => props.definition.properties[key])
  })

  function updateModelProperty(property, value) {
    const data = modelValue.value || {}
    data[property] = value
    //console.log("UPDATE MODEL", data)
    emit('update:modelValue', data)
  }

</script>

<style scoped>

</style>
