<template>
  <div class="w-full h-screen flex flex-col">
    <NavBar />
    <div class="bg-surface-0 dark:bg-surface-900 py-2 px-4 shadow flex items-center gap-2 z-10 flex-wrap">
      <Button label="Add source" icon="pi pi-plus" size="small" data-testid="add-source"
              @click="addNode('source')" />
      <Button label="Add enrich" icon="pi pi-plus" size="small" severity="secondary"
              data-testid="add-enrich" @click="addNode('enrich')" />
      <Button label="Add output" icon="pi pi-plus" size="small" severity="secondary"
              data-testid="add-output" @click="addNode('output')" />
      <Button label="Run sample" icon="pi pi-play" size="small" severity="success"
              data-testid="run-sample" @click="runSample" />
      <Button label="Reset" icon="pi pi-refresh" size="small" severity="warning" variant="outlined" @click="resetGraph" />
      <span v-if="runError" class="text-red-600 text-sm ml-2">{{ runError }}</span>
    </div>
    <div class="flex flex-1 min-h-0">
      <Flow class="flex-1 grow">
        <template #default>
          <component v-for="node of nodes" :key="node.id" :is="nodeComponentByType[node.type]" :node="node"
                       :style="{ left: node.position.x + 'px', top: node.position.y + 'px' }"
                       class="absolute" :data-testid="`node-${node.type}`">
          </component>
        </template>
        <template #foreground-edges>
          <DemoEdge v-for="edge of edges" :key="edge.id" :edge="edge" />
        </template>
        <template #free-edge="{ freeEdge }">
          <DemoEdge v-if="freeEdge" :edge="freeEdge" />
        </template>
      </Flow>
      <aside class="w-80 bg-surface-100 dark:bg-surface-800 border-l border-gray-200 overflow-auto p-3">
        <div class="font-semibold mb-2">Last run</div>
        <pre class="text-xs m-0 whitespace-pre-wrap" data-testid="last-run">{{ lastRunText }}</pre>
      </aside>
    </div>
  </div>
</template>

<script setup>

  import Flow from '../components/Flow.vue'
  import { useFlow } from '../components/index.js'
  import NavBar from "../NavBar.vue"
  import SourceNode from "./SourceNode.vue"
  import EnrichNode from "./EnrichNode.vue"
  import OutputNode from "./OutputNode.vue"
  import DemoEdge from "./DemoEdge.vue"
  import { createSeedGraph, STORAGE_KEY } from "./seedGraph.js"
  import { runDemoGraph } from "./runDemoGraph.js"

  import { computed, onMounted, ref, watch } from 'vue'

  const nodeComponentByType = {
    source: SourceNode,
    enrich: EnrichNode,
    output: OutputNode
  }

  const seed = createSeedGraph()
  const nodes = ref(seed.nodes)
  const edges = ref(seed.edges)
  const lastRun = ref(null)
  const runError = ref('')

  const lastRunText = computed(() => {
    if (!lastRun.value) return 'Press Run sample to execute the graph on the source record.'
    return JSON.stringify(lastRun.value, null, 2)
  })

  function isConnectable(fromNode, fromPort, toNode, toPort) {
    const fromId = typeof fromNode == 'string' ? fromNode : fromNode?.id
    const toId = typeof toNode == 'string' ? toNode : toNode?.id
    if (fromId && toId && fromId === toId) return false
    if (!fromPort || !toPort) return true
    return fromPort !== toPort
      && (fromPort === 'in' || fromPort === 'out')
      && (toPort === 'in' || toPort === 'out')
  }

  function connect(newEdge) {
    if (newEdge.src.port !== 'out' && newEdge.dest.port === 'out') {
      const tmp = newEdge.src
      newEdge.src = newEdge.dest
      newEdge.dest = tmp
    }
    edges.value.push(newEdge)
  }

  const flow = useFlow({
    nodes,
    edges,
    width: 1600,
    height: 900,
    edgeConnectDistance: 48,
    isConnectable,
    connect
  })

  function persistableNodes() {
    return nodes.value.map(node => {
      const { lastRecord, ...rest } = node
      return rest
    })
  }

  onMounted(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          nodes.value = parsed.nodes
          edges.value = parsed.edges
        }
      }
    } catch (err) {
      // keep seed graph
    }
    watch([nodes, edges], () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        nodes: persistableNodes(),
        edges: edges.value
      }))
    }, { deep: true })
  })

  function addNode(type) {
    const id = flow.generateNodeId()
    const node = {
      id,
      type,
      position: {
        x: 80 - flow.position.x,
        y: 80 - flow.position.y
      }
    }
    if (type === 'source') node.record = { sku: 'NEW', qty: 1 }
    if (type === 'enrich') {
      node.field = 'extra'
      node.value = ''
    }
    nodes.value.push(node)
  }

  function resetGraph() {
    const next = createSeedGraph()
    nodes.value = next.nodes
    edges.value = next.edges
    lastRun.value = null
    runError.value = ''
  }

  function runSample() {
    const result = runDemoGraph(nodes.value, edges.value)
    lastRun.value = result
    runError.value = result.error || ''
    if (result.traces) {
      for (const trace of result.traces) {
        const node = nodes.value.find(n => n.id === trace.nodeId)
        if (node) node.lastRecord = trace.record
      }
    }
  }

</script>
