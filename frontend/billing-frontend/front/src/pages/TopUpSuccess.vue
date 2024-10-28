<template>
  <h1>
    {{ topUpId }}
  </h1>
</template>

<script setup>
  import { defineProps, toRefs, computed } from 'vue'

  const props = defineProps({
    encodedId: {
      type: String,
      required: true
    },
  })
  const { encodedId } = toRefs(props)

  const topUpId = computed(() => {
    return encodedId.value.replace(/\(/g, '[').replace(/\)/g, ']')
  })


</script>

<style scoped>

</style>