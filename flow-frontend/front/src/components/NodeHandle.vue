<template>
  <div @mousedown="handleMouseDown"
       @touchstart="handleTouchStart"
       style="cursor: move">
    <slot />
  </div>
</template>

<script setup>

  import { defineProps, defineEmits, toRefs, inject } from "vue"

  const props = defineProps({
    node: {
      type: Object,
      required: true
    }
  })

  const { node } = toRefs(props)

  const flow = inject("flow")

  function handleMouseDown(event) {
    event.preventDefault()
    flow.startDragNode(node.value, event)
  }

  function handleTouchStart(event) {

  }

</script>

<style scoped>

</style>