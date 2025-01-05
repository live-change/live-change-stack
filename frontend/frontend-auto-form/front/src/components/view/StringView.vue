<template>
  <div>
    {{ value }}
  </div>
</template>

<script setup>

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
    i18n: {
      type: String,
      default: ''
    },
  })

  const { value, definition, propName } = toRefs(props)

</script>

<style scoped>

</style>
