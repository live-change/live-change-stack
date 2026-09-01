---
title: Frontend – Flow editor
---

# Frontend – `@live-change/flow-frontend`

`@live-change/flow-frontend` is a **headless Vue 3 canvas** for node-and-edge diagrams: pan, zoom, drag nodes, draw connections between ports, and reconnect edge ends.

It does **not** persist graphs, define node types, or execute a pipeline. The consuming app supplies:

- reactive `nodes` / `edges` arrays
- Vue wrappers for each node type and for edges
- save/load (one JSON document, or separate Node/Edge rows)
- any runtime that walks the graph

## Data model

```javascript
node = { id, position: { x, y }, /* app fields */ }
edge = { id, src: { node, port }, dest: { node, port } }
```

Ports are **not** stored on the node. `NodePort` registers a DOM element with a `portId` and a `direction` `{ x, y }` used by bezier curves (for example `{ x: -1, y: 0 }` on the left, `{ x: 1, y: 0 }` on the right).

Node position is applied by the app (typically `left` / `top` CSS on an `absolute` wrapper). The library tracks bounding boxes so edges can follow ports.

## Composition

Call `useFlow(options)` **once** on the page that owns the canvas. Child node/port components call `useFlow()` with no arguments and receive the same instance via `provide` / `inject`.

```vue
<script setup>
import { ref } from 'vue'
import { Flow, useFlow } from '@live-change/flow-frontend'
import MyNode from './MyNode.vue'
import MyEdge from './MyEdge.vue'

const nodes = ref([{ id: 'a', position: { x: 80, y: 80 } }])
const edges = ref([])

useFlow({
  nodes,
  edges,
  width: 3000,
  height: 3000,
  isConnectable(fromNode, fromPort, toNode, toPort) {
    if (!fromPort || !toPort) return true
    return fromNode !== toNode
  },
  connect(newEdge) {
    edges.value.push(newEdge)
  }
})
</script>

<template>
  <Flow class="flex-1">
    <template #default>
      <MyNode
        v-for="node of nodes" :key="node.id" :node="node"
        class="absolute"
        :style="{ left: node.position.x + 'px', top: node.position.y + 'px' }"
      />
    </template>
    <template #foreground-edges>
      <MyEdge v-for="edge of edges" :key="edge.id" :edge="edge" />
    </template>
    <template #free-edge="{ freeEdge }">
      <MyEdge v-if="freeEdge" :edge="freeEdge" />
    </template>
  </Flow>
</template>
```

Custom **nodes** wrap `Node` + `NodeHandle` + `NodePort`. Custom **edges** wrap `Edge` + `EdgeBezierCurve` + `EdgeEndHandle` (see the kitchen-sink `DemoEdge.vue`).

### `Flow` slots

| Slot | Purpose |
|---|---|
| default | Node views |
| `background-edges` | SVG under nodes |
| `foreground-edges` | SVG over nodes (usual place for edges) |
| `free-edge` | Temporary edge while the user is drawing (`{ freeEdge, flow }`) |

## `useFlow(options)`

| Option | Meaning |
|---|---|
| `nodes`, `edges` | Reactive graph source (`ref` or array) |
| `width`, `height` | Canvas size in CSS pixels (defaults 1024) |
| `minZoom`, `maxZoom` | Scale limits |
| `uidGenerator` | IDs for new nodes/edges/ports |
| `getNodeId` / `findNode` / `findNodeIndex` | ID mapping (default: `node.id`) |
| `getEdgeId` / `findEdge` / `findEdgeIndex` | Same for edges |
| `updateNode` / `deleteNode` / `deleteEdge` | Persist instead of mutating the arrays |
| `connect(newEdge)` | Called when a drawn edge snaps to a port |
| `isConnectable(fromNode, fromPort, toNode, toPort)` | Filter; `port` is `null` for a node-proximity check |
| `edgeConnectDistance` | Drop radius (default 23) |
| `edgeSnapDistance` | Snap of a free end (default 23) |

Returned helpers include `zoom`, `updatePositionAndScale`, `startDragNode`, `startDrawEdge`, `startDragEdgeEnd`, `getPortView`, `getNearestPortView`, `invalidateNodeView`, `generateNodeId` / `generateEdgeId` / `generatePortId`, and `getEventPosition`.

## Persistence

Three patterns:

1. **One JSON document** — store `{ nodes, edges }` on a parent model (a mapping, recipe, or pipeline). Use `synchronized` on that object. Fits small graphs that are versioned and executed as a unit. The kitchen sink (`/`) uses this shape in `localStorage`.
2. **flow-service Node/Edge rows** — `@live-change/flow-service` stores **Graph** (`propertyOfAny` owner), **Node** (`propertyOfAny` graph+logic, `position`, hashed object id), and **Edge** (`itemOfAny` graph+source+destination+connection, ports). Domain ops/wires live in the app service. Use `live(graphOwnedNodes)` / `live(graphOwnedEdges)` and `synchronizedList` on nodes (`updateNode` for drag). Graph id is the Any composite of `ownerType`+`owner`, not the raw owner id — read it from view `graph`. Canvas node id is `row.to` (the hashed Node object id). Delete canvas nodes by deleting **logic**; delete canvas edges by deleting the **connection** (Wire), and let cascade remove flow rows. See [22 Flow service](/server/22-flow-service.html).
3. **App-owned Node and Edge rows** — `itemOf` a parent without flow-service, when the graph *is* the business data and you do not want the shared flow models.

Do not copy EPD’s per-row lists unless you need that domain. For a small executable recipe, prefer one JSON document. For a collaborative editor with a separate logic graph (the `/calc` demo), use flow-service.

## Limitations

- Pan and zoom only when the pointer is on the canvas background, not on a node.
- Touch handlers are stubs (mouse only).
- No built-in selection, undo, grid, minimap, or auto-layout.

## Kitchen-sink and calculation demos

The package is a runnable LiveChange frontend. From `live-change-stack/frontend/flow-frontend`:

```bash
fnm exec -- yarn memDev
```

- **`/` — kitchen sink** (localStorage): mini **record dataflow** Source → Enrich → Output. Toolbar: add nodes, run sample, reset. Graph is saved in `localStorage` (`flow-frontend-demo-graph`).
- **`/calc` — calculation** (server): session-owned Calculation, ops (Constant / Add / Multiply / Power) and Wires in `calculation`, layout in `flow`. Connect creates a Wire then an Edge. Run calls `runCalculation`. Navbar: **Kitchen sink** / **Calculation**.

Copy-paste template (not exported from the package):

- `front/src/demo/FlowKitchenSink.vue` — page, `useFlow`, persist, run
- `front/src/demo/SourceNode.vue`, `EnrichNode.vue`, `OutputNode.vue`, `DemoPort.vue`
- `front/src/demo/DemoEdge.vue`
- `front/src/demo/runDemoGraph.js` — topological walk (demo-only, not a shared runtime)
- `front/src/demo/seedGraph.js`
- `front/src/demo/calculation/FlowCalculationDemo.vue` — server-backed canvas
- `front/src/demo/calculation/ConstantNode.vue`, `AddNode.vue`, `MultiplyNode.vue`, `PowerNode.vue`

Public exports stay in the package `index.js`: `useFlow`, `Flow`, `Node`, `NodeHandle`, `NodePort`, `Edge`, `EdgeBezierCurve`, `EdgeEndHandle`.
