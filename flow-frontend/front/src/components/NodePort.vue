<template>
  <div @mousedown="handleMouseDown"
       @touchstart="handleTouchStart"
       ref="element"
       style="cursor: crosshair">
    <slot />
  </div>
</template>

<script setup>

  import { defineProps, defineEmits, toRefs, inject, watch, onUnmounted, ref } from "vue"

  const props = defineProps({
    node: {
      type: Object,
      required: true
    },
    portId: {
      type: String,
      required: true
    },
    direction: {
      type: Object,
      default: () => ({ x: 0, y: 0 }),
      properties: {
        x: {
          type: Number,
          required: true
        },
        y: {
          type: Number,
          required: true
        }
      }
    },
    newEdgeOptions: {
      type: Object,
      default: () => ({})
    }
  })

  const { node, portId, direction, newEdgeOptions } = toRefs(props)

  const flow = inject("flow")

  const element = ref(null)

  watch(() => element.value, (element) => {
    flow.setPortElement(node.value, portId.value, element, props.direction)
  }, { immediate: true })

  onUnmounted(() => {
    flow.setPortElement(node.value, portId.value, null)
  })

  function handleMouseDown(event) {
    event.preventDefault()
    console.log("start draw edge", node.value.id, portId.value)
    flow.startDrawEdge(node.value, portId.value, event, newEdgeOptions)
  }

  function handleTouchStart(event) {

  }

</script>

<style scoped>

</style>