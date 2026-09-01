<template>
  <DemoNodeCard :node="node" title="Multiply" icon="pi-times" @delete="deleteNode"
                :data-testid="`node-${node.logicType}`">
    <div class="demo-node-section">Product</div>
    <div class="flex items-center p-1">
      <DemoPort :x="-1" :node="node" portId="in" />
      <div class="flex-1 mx-2 text-sm">N inputs</div>
      <DemoPort :x="1" :node="node" portId="out" />
    </div>
  </DemoNodeCard>
</template>

<script setup>

  import DemoNodeCard from "../DemoNodeCard.vue"
  import DemoPort from "../DemoPort.vue"
  import { useFlow } from "../../components/index.js"

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
