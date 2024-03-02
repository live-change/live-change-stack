<template>
  <div ref="element">
    <slot />
  </div>
</template>

<script setup>

  import { defineProps, defineEmits, toRefs, inject, watch, onUnmounted, ref } from "vue"

  const props = defineProps({
    node: {
      type: Object,
      required: true
    }
  })

  const { node } = toRefs(props)

  const flow = inject("flow")

  const element = ref(null)

  watch(() => element.value, (element) => {
    flow.setNodeElement(node.value, element)
  }, { immediate: true })

  onUnmounted(() => {
    flow.setNodeElement(node.value, null)
  })

</script>

<style scoped>

</style>