<template>
  <DemoNodeCard :node="node" title="Power" icon="pi-sort-amount-up" @delete="deleteNode"
                :data-testid="`node-${node.logicType}`">
    <div class="demo-node-section">Exponent</div>
    <div class="flex items-center p-1">
      <DemoPort :x="-1" :node="node" portId="in" />
      <div class="flex-1 mx-2">
        <InputNumber v-if="editable" v-model="editable.exponent" class="w-full" :max-fraction-digits="6"
                     data-testid="power-exponent" />
      </div>
      <DemoPort :x="1" :node="node" portId="out" />
    </div>
  </DemoNodeCard>
</template>

<script setup>

  import DemoNodeCard from "../DemoNodeCard.vue"
  import DemoPort from "../DemoPort.vue"
  import { useFlow } from "../../components/index.js"
  import { synchronized } from '@live-change/vue3-components'
  import { useApi } from '@live-change/vue3-ssr'
  import InputNumber from 'primevue/inputnumber'

  import { computed, defineProps, toRefs } from "vue"

  const props = defineProps({
    node: {
      type: Object,
      required: true
    },
    power: {
      type: Object,
      default: null
    },
    calculationId: {
      type: String,
      default: null
    }
  })

  const { node } = toRefs(props)
  const flow = useFlow()
  const api = useApi()

  const source = computed(() => props.power)
  const sync = synchronized({
    source,
    update: (params) => api.command(['calculation', 'updatePower'], params),
    identifiers: computed(() => ({
      power: node.value.logic,
      calculation: props.calculationId || props.power?.calculation
    })),
    recursive: true
  })
  const { value: editable } = sync

  function deleteNode() {
    flow.deleteNode(node.value)
  }

</script>
