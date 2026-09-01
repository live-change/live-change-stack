<template>
  <div class="w-full h-screen flex flex-col">
    <NavBar />
    <div class="bg-surface-0 dark:bg-surface-900 py-2 px-4 shadow flex items-center gap-2 z-10 flex-wrap">
      <Button label="Add constant" icon="pi pi-plus" size="small" data-testid="add-constant"
              :disabled="!graphId" @click="addOp('Constant')" />
      <Button label="Add add" icon="pi pi-plus" size="small" severity="secondary" data-testid="add-add"
              :disabled="!graphId" @click="addOp('Add')" />
      <Button label="Add multiply" icon="pi pi-plus" size="small" severity="secondary"
              data-testid="add-multiply" :disabled="!graphId" @click="addOp('Multiply')" />
      <Button label="Add power" icon="pi pi-plus" size="small" severity="secondary" data-testid="add-power"
              :disabled="!graphId" @click="addOp('Power')" />
      <Button label="Run" icon="pi pi-play" size="small" severity="success" data-testid="run-calculation"
              :disabled="!calculationId" @click="run" />
      <span v-if="runError" class="text-red-600 text-sm ml-2">{{ runError }}</span>
      <span v-if="calculationId" data-testid="calculation-id" :data-id="calculationId" class="hidden">
        {{ calculationId }}
      </span>
    </div>
    <div class="flex flex-1 min-h-0">
      <Flow class="flex-1 grow">
        <template #default>
          <component
            v-for="node of nodes"
            :key="node.id"
            :is="nodeComponent(node)"
            :node="node"
            :constant="constantById(node.logic)"
            :power="powerById(node.logic)"
            :calculation-id="calculationId"
            class="absolute"
            :style="{ left: (node.position?.x || 0) + 'px', top: (node.position?.y || 0) + 'px' }"
          />
        </template>
        <template #foreground-edges>
          <DemoEdge v-for="edge of canvasEdges" :key="edge.id" :edge="edge" />
        </template>
        <template #free-edge="{ freeEdge }">
          <DemoEdge v-if="freeEdge" :edge="freeEdge" />
        </template>
      </Flow>
      <aside class="w-80 bg-surface-100 dark:bg-surface-800 border-l border-gray-200 overflow-auto p-3">
        <div class="font-semibold mb-2">Last run</div>
        <pre class="text-xs m-0 whitespace-pre-wrap" data-testid="run-results">{{ lastRunText }}</pre>
      </aside>
    </div>
  </div>
</template>

<script setup>

  import Flow from '../../components/Flow.vue'
  import { useFlow } from '../../components/index.js'
  import NavBar from '../../NavBar.vue'
  import DemoEdge from '../DemoEdge.vue'
  import ConstantNode from './ConstantNode.vue'
  import AddNode from './AddNode.vue'
  import MultiplyNode from './MultiplyNode.vue'
  import PowerNode from './PowerNode.vue'

  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { usePath, live, useApi, useClient } from '@live-change/vue3-ssr'
  import { synchronizedList } from '@live-change/vue3-components'

  const nodeComponentByType = {
    calculation_Constant: ConstantNode,
    calculation_Add: AddNode,
    calculation_Multiply: MultiplyNode,
    calculation_Power: PowerNode
  }

  const deleteActionByType = {
    calculation_Constant: { name: 'deleteConstant', key: 'constant' },
    calculation_Add: { name: 'deleteAdd', key: 'add' },
    calculation_Multiply: { name: 'deleteMultiply', key: 'multiply' },
    calculation_Power: { name: 'deletePower', key: 'power' }
  }

  const path = usePath()
  const api = useApi()
  const client = useClient()
  const route = useRoute()
  const router = useRouter()

  const creating = ref(false)
  const lastRun = ref(null)
  const runError = ref('')
  const nextNodeSlot = ref(0)

  const calculations = await live(computed(() => client.value?.session
    ? path.calculation.sessionOwnedCalculations({ session: client.value.session })
    : null))

  const calculationId = computed(() => route.params.calculation || calculations.value?.[0]?.id || null)

  watch(calculationId, () => {
    nextNodeSlot.value = 0
  })

  watch([calculations, () => client.value?.session, () => route.params.calculation], async () => {
    if(typeof window == 'undefined') return
    if(route.params.calculation) return
    const session = client.value?.session
    if(!session) return
    const list = calculations.value || []
    if(list.length) {
      await router.replace({ name: 'calculationDetail', params: { calculation: list[0].id } })
      return
    }
    if(creating.value) return
    creating.value = true
    try {
      const id = await api.command(['calculation', 'createCalculation'], { session })
      await router.replace({ name: 'calculationDetail', params: { calculation: id } })
    } finally {
      creating.value = false
    }
  }, { immediate: true })

  const graph = await live(computed(() => calculationId.value
    ? path.flow.graph({
      ownerType: 'calculation_Calculation',
      owner: calculationId.value
    })
    : null))

  const graphId = computed(() => graph.value?.id || null)

  function rowObjectId(row) {
    return row?.to || row?.id
  }

  const nodeRows = await live(computed(() => graphId.value
    ? path.flow.graphOwnedNodes({
      graphType: 'flow_Graph',
      graph: graphId.value
    })
    : null))

  const edgeRows = await live(computed(() => graphId.value
    ? path.flow.graphOwnedEdges({
      graphType: 'flow_Graph',
      graph: graphId.value
    })
    : null))

  const constants = await live(computed(() => calculationId.value
    ? path.calculation.calculationOwnedConstants({ calculation: calculationId.value })
    : null))

  const powers = await live(computed(() => calculationId.value
    ? path.calculation.calculationOwnedPowers({ calculation: calculationId.value })
    : null))

  const nodeSource = computed(() => (nodeRows.value || []).map(row => ({
    ...row,
    id: rowObjectId(row)
  })))
  const syncNodes = synchronizedList({
    source: nodeSource,
    update: (params) => api.command(['flow', 'updateNode'], params),
    objectIdentifiers: (object) => ({
      graphType: object.graphType,
      graph: object.graph,
      logicType: object.logicType,
      logic: object.logic
    }),
    recursive: true
  })

  const nodes = syncNodes.value

  const canvasEdges = computed(() => (edgeRows.value || []).map(edge => ({
    id: rowObjectId(edge),
    src: { node: edge.source, port: edge.sourcePort },
    dest: { node: edge.destination, port: edge.destinationPort },
    connection: edge.connection
  })))

  function nodeById(nodeId) {
    return nodes.value.find(node => node.id == nodeId)
  }

  function isConnectable(fromNode, fromPort, toNode, toPort) {
    const fromId = typeof fromNode == 'string' ? fromNode : fromNode?.id
    const toId = typeof toNode == 'string' ? toNode : toNode?.id
    if(fromId && toId && fromId === toId) return false
    if(!fromPort || !toPort) return true
    return fromPort !== toPort
      && (fromPort === 'in' || fromPort === 'out')
      && (toPort === 'in' || toPort === 'out')
  }

  async function connect(newEdge) {
    if(newEdge.src.port !== 'out' && newEdge.dest.port === 'out') {
      const tmp = newEdge.src
      newEdge.src = newEdge.dest
      newEdge.dest = tmp
    }
    const srcNode = nodeById(newEdge.src.node)
    const destNode = nodeById(newEdge.dest.node)
    if(!srcNode || !destNode || !graphId.value) return
    const wireId = await api.command(['calculation', 'createWire'], {
      sourceType: srcNode.logicType,
      source: srcNode.logic,
      destinationType: destNode.logicType,
      destination: destNode.logic,
      sourcePort: newEdge.src.port,
      destinationPort: newEdge.dest.port
    })
    await api.command(['flow', 'createEdge'], {
      graphType: 'flow_Graph',
      graph: graphId.value,
      sourceType: 'flow_Node',
      source: newEdge.src.node,
      destinationType: 'flow_Node',
      destination: newEdge.dest.node,
      connectionType: 'calculation_Wire',
      connection: wireId,
      sourcePort: newEdge.src.port,
      destinationPort: newEdge.dest.port
    })
  }

  async function deleteLogicNode(node) {
    const spec = deleteActionByType[node.logicType]
    if(!spec) return
    await api.command(['calculation', spec.name], { [spec.key]: node.logic })
  }

  async function deleteWireEdge(edge) {
    if(!edge.connection) return
    await api.command(['calculation', 'deleteWire'], { wire: edge.connection })
  }

    const flow = useFlow({
    nodes,
    edges: canvasEdges,
    width: 1600,
    height: 900,
    edgeConnectDistance: 48,
    isConnectable,
    connect,
    deleteNode: deleteLogicNode,
    deleteEdge: deleteWireEdge
  })

  function nodeComponent(node) {
    return nodeComponentByType[node.logicType]
  }

  function constantById(id) {
    const row = (constants.value || []).find(row => rowObjectId(row) == id || row.id == id)
    if(!row) return null
    return { ...row, id: rowObjectId(row) }
  }

  function powerById(id) {
    const row = (powers.value || []).find(row => rowObjectId(row) == id || row.id == id)
    if(!row) return null
    return { ...row, id: rowObjectId(row) }
  }

  async function addOp(kind) {
    if(!calculationId.value || !graphId.value) return
    const createName = 'create' + kind
    const logicType = 'calculation_' + kind
    const logic = await api.command(['calculation', createName], {
      calculation: calculationId.value
    })
    const slot = nextNodeSlot.value
    nextNodeSlot.value = slot + 1
    await api.command(['flow', 'setNode'], {
      graphType: 'flow_Graph',
      graph: graphId.value,
      logicType,
      logic,
      position: {
        x: 80 + (slot % 4) * 360,
        y: 80 + Math.floor(slot / 4) * 260
      }
    })
  }

  async function run() {
    if(!calculationId.value) return
    const result = await api.command(['calculation', 'runCalculation'], {
      calculation: calculationId.value
    })
    lastRun.value = result
    runError.value = result?.error || ''
  }

  const lastRunText = computed(() => {
    if(!lastRun.value) return 'Press Run to execute the calculation graph.'
    return JSON.stringify(lastRun.value, null, 2)
  })

</script>
