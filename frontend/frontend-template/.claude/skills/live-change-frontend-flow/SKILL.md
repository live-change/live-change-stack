---
name: live-change-frontend-flow
description: Build Vue node-and-edge diagrams with @live-change/flow-frontend — useFlow, custom nodes/ports/edges, graph persistence as one JSON document vs flow-service Node/Edge rows
---

# Skill: live-change-frontend-flow

Use this skill when adding or editing a flow / graph / pipeline canvas in a LiveChange Vue frontend.

## When to use

- Node-and-edge editor (dataflow, LCA, mapping, pipeline).
- Wiring `@live-change/flow-frontend` (`useFlow`, `Flow`, `Node`, `NodePort`, `Edge`).
- Choosing how to persist the graph.

## Do not copy EPD LCA components

`epd-app/front/src/system/flow/*` is domain-specific (process/impact, amounts, units). Reuse the **library** and the **kitchen sink**, not ProcessNode / LCAFlowEdge.

## Composition checklist

1. `useFlow({ nodes, edges, width, height, isConnectable, connect })` once on the page.
2. Children call `useFlow()` with no args.
3. `<Flow>` slots: default (nodes), `foreground-edges`, `free-edge`.
4. Each node type wraps `Node` + `NodeHandle` + `NodePort`.
5. Edges wrap `Edge` + `EdgeBezierCurve` + `EdgeEndHandle`.
6. Position nodes with `class="absolute"` and `left` / `top` from `node.position`.

Import in an app:

```javascript
import { Flow, useFlow, Node, NodeHandle, NodePort, Edge, EdgeBezierCurve, EdgeEndHandle }
  from '@live-change/flow-frontend'
```

## Persistence

- **Recipe / mapping / small graph** (XML position in → enrich → out): one field `{ nodes, edges }` on the parent model. Use `synchronized` on that object. Kitchen sink (`/`) uses this in `localStorage`.
- **Collaborative editor with separate logic** (calculation demo `/calc`): `@live-change/flow-service` **Graph / Node / Edge**. Domain ops and Wires stay in the app service. `live(graphOwnedNodes)` + `live(graphOwnedEdges)`, `synchronizedList` → `updateNode` for drag. Graph id is the Any composite of owner type+id (not the raw owner id). Node object ids are hashed (`h_` + 22 chars); canvas id is `row.to`. Delete a canvas node by deleting **logic**; delete a canvas edge by deleting the **Wire** (`connection`), not `deleteEdge` / `resetNode` alone.
- **App-owned Node/Edge rows** without flow-service: only when the graph *is* the business data and you do not want the shared flow models.

Do not use `synchronizedList` per node for a small executable recipe stored as one JSON document.

Docs: `live-change-stack/docs/docs/server/22-flow-service.md`, `live-change-stack/docs/docs/frontend/14-flow-frontend.md`.

## Copy-paste template

Kitchen sink and calculation demo inside the package (not public exports):

- `live-change-stack/frontend/flow-frontend/front/src/demo/FlowKitchenSink.vue`
- `SourceNode.vue`, `EnrichNode.vue`, `OutputNode.vue`, `DemoPort.vue`, `DemoEdge.vue`
- `runDemoGraph.js` (topo execute — keep runtime in the app, not in the canvas library)
- `front/src/demo/calculation/FlowCalculationDemo.vue` — server Graph/Node/Edge + calculation ops

Run demo: from `live-change-stack/frontend/flow-frontend`, `fnm exec -- yarn memDev`.

## Docs

`live-change-stack/docs/docs/frontend/14-flow-frontend.md`
