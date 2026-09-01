<template>
  <DemoNodeCard :node="node" title="Source" icon="pi-database" @delete="deleteNode">
    <div class="demo-node-section">Sample record</div>
    <div class="flex items-center p-1">
      <Textarea v-model="recordJson" class="w-full text-sm mx-2" rows="6" autoResize />
      <DemoPort :x="1" :node="node" portId="out" />
    </div>
    <div v-if="jsonError" class="text-red-600 text-xs px-3 pb-1">{{ jsonError }}</div>
  </DemoNodeCard>
</template>

<script setup>

  import DemoNodeCard from "./DemoNodeCard.vue"
  import DemoPort from "./DemoPort.vue"
  import { useFlow } from "../components/index.js"

  import { computed, defineProps, ref, toRefs } from "vue"

  const props = defineProps({
    node: {
      type: Object,
      required: true
    }
  })

  const { node } = toRefs(props)
  const flow = useFlow()
  const jsonError = ref('')

  const recordJson = computed({
    get() {
      return JSON.stringify(node.value.record ?? {}, null, 2)
    },
    set(value) {
      try {
        node.value.record = JSON.parse(value)
        jsonError.value = ''
      } catch (err) {
        jsonError.value = 'Invalid JSON'
      }
    }
  })

  function deleteNode() {
    flow.deleteNode(node.value)
  }

</script>
