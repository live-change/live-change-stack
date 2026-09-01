---
title: Flow service
---

# Flow service (`@live-change/flow-service`)

`@live-change/flow-service` persists a **visual graph** as three models: **Graph**, **Node**, and **Edge**. Domain logic (ops, wires, recipes) lives in the app service. Flow-service stores layout and connections so a Vue canvas (`@live-change/flow-frontend`) can `live()` lists and autosave positions.

Service name: `flow`. It uses `relationsPlugin` only. Access is configured with `readAccess` / `writeAccess` (the package defaults both to `() => true` for demos; apps should replace them).

## Models

```
Graph  propertyOfAny (owner)                       // 1:1 with owner
Node   propertyOfAny (graph, logic)                { position: { x, y }, hashId: true }
Edge   itemOfAny (graph, source, destination, connection) { sourcePort, destinationPort }
```

Configure allowed types in `app.config.js`:

```js
{
  name: 'flow',
  ownerTypes: ['calculation_Calculation'],
  logicTypes: [
    'calculation_Constant', 'calculation_Add',
    'calculation_Multiply', 'calculation_Power'
  ],
  graphTypes: ['flow_Graph'],   // default
  nodeTypes: ['flow_Node'],     // default
  connectionTypes: ['calculation_Wire']
}
```

Pass `ownerTypes` / `logicTypes` / `connectionTypes` from the app. Empty type lists make `deleteObject` cascade listen to **all** types; typed lists skip unrelated deletes.

## Identifiers and Graph id

`propertyOfAny` / `itemOfAny` ids are **composite Any ids**: `JSON.stringify(type)` + `:` + `JSON.stringify(id)` for each parent, joined by `:`.

Graph has one parent (`owner`), so `sameIdAsParent` applies. The Graph **id is not the raw owner id**. It is:

```js
JSON.stringify(ownerType) + ':' + JSON.stringify(owner)
// e.g. '"calculation_Calculation":"abc123"'
```

Use `live(path.flow.graph({ ownerType, owner }))` and then `graph.id` as `graph` on Node/Edge. Do not assume `Graph.id === Calculation.id`.

Node uses `hashId: true`, so its object id is `h_` plus 22 base64url characters — not the four-part composite of `graphType`, `graph`, `logicType`, `logic`. Look up a Node with `live(path.flow.node({ graphType, graph, logicType, logic }))` or from `graphOwnedNodes` (`row.to`). Nested composite Node ids in Edge index keys exceed LMDB’s ~254-character UTF-16 key limit and fail with **`MDB_BAD_VALSIZE`**. See [When to set hashId](/server/09-02-propertyOfAny-itemOfAny.html#when-to-set-hashid).

Existing databases that already stored composite Node ids must be rebuilt after this change.

## Generated API (typical names)

Confirm with `fnm exec -- tsx server/start.js describe --service flow --output yaml`.

| Kind | Names |
|---|---|
| Graph | `setGraph`, `updateGraph`, `resetGraph`, view `graph` |
| Node | `setNode`, `updateNode`, `resetNode`, `graphOwnedNodes`, `logicOwnedNodes` |
| Edge | `createEdge`, `updateEdge`, `deleteEdge`, `graphOwnedEdges`, `sourceOwnedEdges`, `destinationOwnedEdges`, `connectionOwnedEdges` |

`itemOfAny` also generates the **full-parent** range view (all four parents) plus **partial** combination views (`graphOwnedEdges`, …). That is why a canvas can list edges by graph alone.

CRUD trigger names follow `{service}_{action}`, e.g. `flow_setGraph`, `flow_createEdge`.

## Cascade

Parent delete fires `deleteObject` (typed `*Any` skips when `objectType` is not in `parentsTypes`). Children are removed across services: deleting a `calculation_Constant` deletes the `flow_Node`; deleting that Node or a `calculation_Wire` deletes `flow_Edge`.

Do **not** auto-create Edge from Wire in flow-service (avoids double-create). The editor creates the domain Wire, then `createEdge`.

## Uniqueness

`changeFlow_Edge` is queued by `(connectionType, connection)` so at most one Edge exists per connection (Wire). On create it ranges `byConnection` and rejects extras (`edge_exists`). Source and destination must be `flow_Node`. Ports on the Edge must match the Wire when the connection row is readable (`connection_not_found` / `edge_port_mismatch` otherwise).

The change-trigger payload is `{ objectType, object, identifiers, data, oldData, changeType }` (see [09-00](/server/09-00-relations-generated-artifacts.html)). `queuedBy` reads `trig.data.identifiers`.

## Attaching a domain service

Example: `calculation` in flow-frontend.

1. Domain models: Calculation, ops (Constant / Add / …), Wire (`itemOfAny` source/destination + ports).
2. On `createCalculation_Calculation`, `triggerService` `flow` / `flow_setGraph` with `ownerType: 'calculation_Calculation'`, `owner: object`.
3. The editor calls `setNode` after creating an op (layout belongs to the UI).
4. Connect: `createWire` then `createEdge` (node ids + wire id + ports).
5. Delete a node from the canvas by **deleting the logic** (`deleteConstant`, …), not `resetNode` — cascade removes Node, Wires, and Edges.
6. Delete an edge from the canvas by **`deleteWire`**, not `deleteEdge` alone.

See the calculation demo page at `/calc` and [14 Flow editor](/frontend/14-flow-frontend.html).

Second example: vole-apps **`enricher`**. Owner is `enricher_Enricher` (not the raw Enricher id — Graph id is the Any composite). Domain ops are Input / Output (and later FetchPage / DomExtract); connections are **`enricher_Wire`**, not `flow_Edge`. The canvas still `setNode` / `createEdge` for layout. **`runEnricher` reads domain Wires and ops**, not flow Edge rows. Item source is xml-search `dataSetItems({ from, limit: 1 })` (the search reader waits for download); the enricher does not poll DataSet state.
