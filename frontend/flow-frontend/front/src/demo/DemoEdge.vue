<template>
  <Edge :edge="edge">
    <template #default="{ src, dest }">
      <EdgeBezierCurve :src="src" :dest="dest" v-slot="{ bezierPath }" >
        <path :d="bezierPath" stroke="black" fill="none" stroke-width="10" stroke-linecap="round" />
        <path :d="bezierPath" stroke="rgb(76, 175, 80)" fill="none" stroke-width="9" stroke-linecap="round"
              :data-testid="`delete-edge-${edgeTestId}`" class="pointer-events-auto cursor-pointer"
              @click.stop="flow.deleteEdge(edge)" />
      </EdgeBezierCurve>

      <EdgeEndHandle v-if="edge.src.node && edge.dest.node" :position="src" :edge="edge" end="src" />
      <EdgeEndHandle v-if="edge.dest.node && edge.src.node" :position="dest" :edge="edge" end="dest" />
    </template>
  </Edge>
</template>

<script setup>

  import Edge from "../components/Edge.vue"
  import EdgeBezierCurve from "../components/EdgeBezierCurve.vue"
  import EdgeEndHandle from "../components/EdgeEndHandle.vue"

  import { defineProps, toRefs, computed } from "vue"
  import { useFlow } from "../components/index.js"
  import { flowTestId } from "./flowTestId.js"

  const props = defineProps({
    edge: {
      type: Object,
      required: true
    }
  })

  const { edge } = toRefs(props)
  const flow = useFlow()
  const edgeTestId = computed(() => flowTestId(edge.value?.id))

</script>
