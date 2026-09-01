<template>
  <DemoNodeCard :node="node" title="Enrich" icon="pi-cog" @delete="deleteNode">
    <div class="demo-node-section">Add field</div>
    <div class="flex items-center p-1">
      <DemoPort :x="-1" :node="node" portId="in" />
      <div class="flex-1 mx-2">
        <InputText v-model="node.field" class="w-full text-sm mb-2" placeholder="field name" />
        <InputText v-model="node.value" class="w-full text-sm" placeholder="value" />
      </div>
      <DemoPort :x="1" :node="node" portId="out" />
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
