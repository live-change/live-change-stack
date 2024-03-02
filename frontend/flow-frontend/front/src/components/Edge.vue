<template>
  <g>
    <slot v-if="src && dest" v-bind="{ src, dest }"></slot>
  </g>
</template>

<script setup>

  import { computed, ref, defineProps, defineEmits, toRefs, inject } from "vue"

  const props = defineProps({
    edge: {
      type: Object,
      required: true
    }
  })

  const { edge } = toRefs(props)

  const flow = inject("flow")

  const srcView = computed(() => edge.value.src.node && flow.getPortView(edge.value.src.node, edge.value.src.port))
  const destView = computed(() => edge.value.dest.node && flow.getPortView(edge.value.dest.node, edge.value.dest.port))

  function edgePoint(edgePort, view, otherEdgePort) {
    if(view) {
      return {
        ...edgePort,
        x: view.rect.x + view.rect.width / 2,
        y: view.rect.y + view.rect.height / 2,
        direction: view.direction,
      }
    }
    if(edgePort.x && edgePort.y) {
      const searchPosition = { x: edgePort.x, y: edgePort.y }
      const maxDistance = flow.options.edgeSnapDistance ?? 23
      const { portView } = flow.getNearestPortView(searchPosition, maxDistance,
          (node, port) => flow.options.isConnectable
          ? flow.options.isConnectable(otherEdgePort.node, otherEdgePort.port, node, port) : true
      )
      //console.log('PV', flow.options, portView)
      if(portView) {
        return {
          ...edgePort,
          x: portView.rect.x + portView.rect.width / 2,
          y: portView.rect.y + portView.rect.height / 2,
          direction: portView.direction,
        }
      }
      return {
        ...edgePort
      }
    }
  }

  const src = computed(() => edgePoint(edge.value.src, srcView.value, edge.value.dest))
  const dest = computed(() => edgePoint(edge.value.dest, destView.value, edge.value.src))

</script>

<style scoped>

</style>