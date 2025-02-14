<template>
  <div>
    <pre>{{ JSON.stringify(value, null, 2) }}</pre>
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
  })

  const { value, definition, propName } = toRefs(props)

</script>

<style scoped>

</style>
