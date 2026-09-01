# @live-change/flow-frontend

Headless Vue 3 **node-and-edge canvas**: pan, zoom, drag nodes, connect ports, reconnect edge ends.

The app supplies node/edge Vue wrappers, graph data, persistence, and any execution runtime.

## Public exports

`useFlow`, `Flow`, `Node`, `NodeHandle`, `NodePort`, `Edge`, `EdgeBezierCurve`, `EdgeEndHandle`

## Run the kitchen-sink demo

From this package directory (use the repo Node version via `fnm`):

```bash
fnm exec -- yarn memDev
```

Open the printed local URL. `/` is a sample dataflow (source → enrich → output) with `localStorage` persistence and **Run sample**.

## Docs

- Stack chapter: [Frontend – Flow editor](../../docs/docs/frontend/14-flow-frontend.md)
- Copy-paste demo: `front/src/demo/`

## Embedding in another app

```javascript
import { Flow, useFlow, Node, NodeHandle, NodePort, Edge, EdgeBezierCurve, EdgeEndHandle }
  from '@live-change/flow-frontend'
```

Do not import `front/src/demo/*` from the package entry — those files are the sample app only.
