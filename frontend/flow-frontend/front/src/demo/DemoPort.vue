<template>
  <div class="relative w-4 h-4 shrink-0">
    <NodePort :node="node" :portId="portId" :direction="{ x, y: 0 }"
         class="absolute rounded-full bg-green-500 w-4 h-4 border border-white"
         :style="{ left: `${-0.5 + x * 0.3}rem`, top: `-0.5rem` }"
         :data-testid="`port-${flowTestId(node.id)}-${portId}`">
    </NodePort>
  </div>
</template>

<script setup>

  import { defineProps, toRefs } from "vue"
  import NodePort from "../components/NodePort.vue"
  import { flowTestId } from "./flowTestId.js"

  const props = defineProps({
    x: {
      type: Number,
      required: true
    },
    node: {
      type: Object,
      required: true
    },
    portId: {
      type: String,
      required: true
    }
  })

  const { x, node, portId } = toRefs(props)

</script>
