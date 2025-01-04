<template>
  <div v-if="definition" class="grid formgrid p-fluid mt-2 mb-2">
    <AutoViewField v-for="property in propertiesList" :key="property"
                :value="value?.[property]"
                :definition="definition.properties[property]"
                :label="property"
                :name="property"
                :rootValue="props.rootValue" :propName="(propName ? propName + '.' : '') + property"
                :i18n="i18n"
                class="col-12" />
  </div>
</template>

<script setup>
  import AutoViewField from "./AutoViewField.vue"

  import { computed, inject, getCurrentInstance, toRefs } from 'vue'

  const props = defineProps({
    value: {},
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
    class: {},
    style: {},
    i18n: {
      type: String,
      default: ''
    },
    visibleProperties: {
      type: Array,
      items: {
        type: String
      }
    }
  })

  const { value, definition, propName, visibleProperties } = toRefs(props)

  const propertiesList = computed(() =>
    visibleProperties.value ??
    props.definition.visibleProperties ??
    (definition.value.properties
        ? Object.keys(definition.value.properties).filter(key => props.definition.properties[key])
        : [])
  )

</script>

<style scoped>

</style>
