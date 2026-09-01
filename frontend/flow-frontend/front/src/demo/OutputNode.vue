<template>
  <DemoNodeCard :node="node" title="Output" icon="pi-box" @delete="deleteNode">
    <div class="demo-node-section">Result</div>
    <div class="flex items-center p-1">
      <DemoPort :x="-1" :node="node" portId="in" />
      <pre class="demo-node-result flex-1 mx-2 my-0 overflow-auto">{{
        JSON.stringify(node.lastRecord ?? {}, null, 2)
      }}</pre>
    </div>
  </DemoNodeCard>
</template>

<script setup>

  import DemoNodeCard from "./DemoNodeCard.vue"
  import DemoPort from "./DemoPort.vue"
  import { useFlow } from "../components/index.js"

  import { defineProps, toRefs } from "vue"

  const props = defineProps({
    node: {
      type: Object,
      required: true
    }
  })

  const { node } = toRefs(props)
  const flow = useFlow()

  function deleteNode() {
    flow.deleteNode(node.value)
  }

</script>

<style scoped>
  .demo-node-result {
    font-size: 0.75rem;
    max-height: 8rem;
    background: var(--p-surface-50, #f9fafb);
    border-radius: 8px;
    padding: 0.4rem 0.5rem;
  }
</style>
