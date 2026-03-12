---
description: Design models with userItem, itemOf, propertyOf relations and access control
---

# Skill: live-change-design-models-relations (Claude Code)

Use this skill when you design or refactor **models and relations** in a LiveChange service.

## When to use

- You are adding a new model to a service.
- You want to switch from manual CRUD/views to proper relations.
- You need consistent access control and index usage.

## Step 1 – Decide the relation type

For each new model, decide how it relates to the rest of the domain:

- **`userItem`** – the object belongs to the signed-in user (e.g. user’s device).
- **`itemOf`** – a list of children belonging to a parent model (e.g. device connections).
- **`propertyOf`** – a single state object with the same id as the parent (e.g. cursor state).
- **no relation** – for global data or other special cases.

Choose one main relation; other associations can be plain fields + indexes.

## Step 2 – Define `properties` clearly

1. Use a **multi-line** style for properties, with clear `type`, `default`, `validation`, etc.
2. Avoid unreadable one-liners combining everything.

Example:

```js
properties: {
  name: {
    type: String,
    validation: ['nonEmpty']
  },
  status: {
    type: String,
    default: 'offline'
  },
  capabilities: {
    type: Array,
    of: {
      type: String
    }
  }
}
```

## Step 3 – Configure the relation

### `userItem`

1. Add a `userItem` block inside the model definition.
2. Set roles for read/write and list which fields can be written.

```js
userItem: {
  readAccessControl: { roles: ['owner', 'admin'] },
  writeAccessControl: { roles: ['owner', 'admin'] },
  writeableProperties: ['name']
}
```

### `itemOf`

1. Decide the parent model.
2. If the parent is in another service, declare it via `foreignModel` (see next step).

```js
itemOf: {
  what: Device,
  readAccessControl: { roles: ['owner', 'admin'] },
  writeAccessControl: { roles: ['owner', 'admin'] }
}
```

### `propertyOf`

1. Use when the child should share the same id as the parent.
2. This simplifies lookups and avoids extra indexes.

```js
propertyOf: {
  what: Device,
  readAccessControl: { roles: ['owner', 'admin'] },
  writeAccessControl: { roles: ['owner', 'admin'] }
}
```

### `propertyOf` with multiple parents (1:1 link to each)

Use this when a model should act as a dedicated 1:1 link between multiple entities (e.g. invoice ↔ contractor role links),
so the relations/CRUD generator can treat it as a relation rather than a plain `someId` property.

Notes:

- Usually you’ll have 1–2 parents, but the `propertyOf` list may contain **any number** of parent models (including 3+).
- If the entity is a relation, avoid adding manual `...Id` fields in `properties` just to represent the link — CRUD generators won’t treat it as a relation.

Example:

```js
const CostInvoice = definition.foreignModel('invoice', 'CostInvoice')
const Contractor = definition.foreignModel('company', 'Contractor')

definition.model({
  name: 'Supplier',
  properties: {
    // optional extra fields
  },
  propertyOf: [
    { what: CostInvoice },
    { what: Contractor }
  ]
})
```

## Step 4 – Use `foreignModel` for cross-service relations

1. At the top of the domain file, declare:

```js
const Device = definition.foreignModel('deviceManager', 'Device')
```

2. Then use `Device` in `itemOf` or `propertyOf`:

```js
itemOf: {
  what: Device,
  readAccessControl: { roles: ['owner', 'admin'] }
}
```

## Step 5 – Add indexes

1. Identify frequent queries:
   - by a single field (e.g. `sessionKey`),
   - by combinations (e.g. `(device, status)`).
2. Declare indexes in the model:

```js
indexes: {
  bySessionKey: {
    property: ['sessionKey']
  },
  byDeviceAndStatus: {
    property: ['device', 'status']
  }
}
```

3. Use these indexes in views/actions, via `indexObjectGet` / `indexRangeGet`.

## Step 6 – Set access control on relations

1. For `userItem`, `itemOf`, and `propertyOf`, always define:
   - `readAccessControl`,
   - `writeAccessControl`.
2. Don’t rely on unspecified defaults; access rules should be explicit in the model.

## Step 7 – Check auto-generated views/actions

1. After adding relations, review the auto-generated views/actions:
   - “my X” views and CRUD for `userItem`,
   - parent-scoped lists for `itemOf`/`propertyOf`.
2. Only add custom views/actions when:
   - you need special filters,
   - or custom logic not covered by the generated ones.

