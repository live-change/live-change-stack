<template>
  <div>

  </div>
</template>

<script setup>


  const props = defineProps({
    modelValue: {
    },
    definition: {
      type: Object
    },
    properties: {
      type: Object,
      default: () => ({})
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const { value, definition, modelValue } = toRefs(props)

</script>

<style scoped>

</style>
