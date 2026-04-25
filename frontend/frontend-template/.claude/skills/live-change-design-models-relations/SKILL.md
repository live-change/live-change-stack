---
name: live-change-design-models-relations
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
3. **Do NOT re-declare fields that are auto-added by relations.** Each relation automatically adds identifier fields and indexes:

| Relation | Auto-added field(s) | Auto-added index(es) |
|---|---|---|
| `itemOf: { what: Device }` | `device` | `byDevice` |
| `propertyOf: { what: Device }` | `device` | `byDevice` |
| `userItem` | `user` | `byUser` |
| `sessionOrUserProperty` | `sessionOrUserType`, `sessionOrUser` | `bySessionOrUser` |
| `propertyOfAny: { to: ['owner'] }` | `ownerType`, `owner` | `byOwner` |

Naming convention: parent model name with first letter lowercased (`Device` → `device`, `CostInvoice` → `costInvoice`). Polymorphic relations add a `Type` + value pair (e.g. `ownerType` + `owner`).

Example:

```js
// ✅ Only define YOUR fields — 'device' is auto-added by itemOf
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

## Step 2b – Relation arity rules (critical)

Treat arity on two levels:

- **Annotation arity**: can the annotation itself be a list of configs?
- **Parent tuple arity**: can one config point to multiple parents/dimensions?

| Relation | Annotation arity | Parent tuple arity |
|---|---|---|
| `propertyOf`, `itemOf`, `boundTo` | single config only | `what` can be one model or `[A, B, ...]` |
| `relatedTo` | single config or config list | each config uses `what` with one model or `[A, B, ...]` |
| `propertyOfAny`, `itemOfAny`, `boundToAny` | single config only | `to` can contain one or many names |
| `relatedToAny` | single config or config list | each config uses `to` with one or many names |

Guardrail:

- valid: `propertyOf: { what: [A, B] }`
- invalid: `propertyOf: [configA, configB]`

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

- Usually you’ll have 1–2 parents, but `what` may contain **any number** of parent models (including 3+).
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
  propertyOf: {
    what: [CostInvoice, Contractor]
  }
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

### Step 5b – Use `function` indexes for derived keys

Use a `function` index when key parts are not stored directly as properties (for example `yearMonth` derived from `date`).

Key rules:

- Keep index entries stable and deterministic.
- Build composite keys as serialized parts joined with `:` and append `_' + id`.
- Emit `{ id, to }` objects so `to` points to the source model id.
- Prefer `table.map(mapper).to(output)` over manual `onChange(...output.change...)`.
- `map()` drops `null` results automatically, so mapper can stay clean.

Example:

```js
indexes: {
  byBankAccountAndMonthAndDate: {
    function: async (input, output, { tableName }) => {
      const table = await input.table(tableName)
      const mapper = obj => ({
        id: [
          obj.bankAccount,
          obj.date?.slice(0, 7),   // YYYY-MM month bucket
          obj.date
        ].map(v => JSON.stringify(v)).join(':') + '_' + obj.id,
        to: obj.id
      })
      await table.map(mapper).to(output)
    },
    parameters: {
      tableName: definition.name + '_BankTransaction'
    }
  }
}
```

This format matches how property indexes are serialized internally and works well with range-prefix filtering in views.

> **IMPORTANT — serialization constraint:** Function indexes are serialized via `toString()` and executed remotely. The mapper and all helpers **must be defined inside the function body** — not in module scope. References to outer variables or imports will be `undefined` at runtime.

## Step 6 – Set access control on relations

1. For `userItem`, `itemOf`, and `propertyOf`, always define:
   - `readAccessControl`,
   - `writeAccessControl`.
2. Don’t rely on unspecified defaults; access rules should be explicit in the model.

## Step 7 – Grant access on `entity` model creation

Models with `entity` and `writeAccessControl` / `readAccessControl` check roles on every CRUD operation, but do **not** auto-grant roles to the creator. Without granting roles, the creator cannot even read their own object.

Add a change trigger that grants `'owner'` on creation:

```js
definition.trigger({
  name: 'changeMyService_MyModel',
  properties: {
    object: { type: MyModel, validation: ['nonEmpty'] },
    data: { type: Object },
    oldData: { type: Object }
  },
  async execute({ object, data, oldData }, { client, triggerService }) {
    if (!data || oldData) return   // only on create
    if (!client?.user) return

    await triggerService({ service: 'accessControl', type: 'accessControl_setAccess' }, {
      objectType: 'myService_MyModel',   // format: serviceName_ModelName
      object,
      roles: ['owner'],
      sessionOrUserType: 'user_User',
      sessionOrUser: client.user,
      lastUpdate: new Date()
    })
  }
})
```

For objects that should also be publicly readable, add `accessControl_setPublicAccess`:

```js
await triggerService({ service: 'accessControl', type: 'accessControl_setPublicAccess' }, {
  objectType: 'myService_MyModel',
  object,
  userRoles: ['reader'],       // roles for all logged-in users
  sessionRoles: ['reader'],    // roles for all sessions (including anonymous)
  lastUpdate: new Date()
})
```

**Note:** `userItem` and `itemOf`/`propertyOf` relations automatically handle access through the parent — you typically don't need manual `triggerService` calls for those. This step applies primarily to `entity` models.

## Step 8 – Check auto-generated views/actions

1. After adding relations, review the auto-generated views/actions:
   - “my X” views and CRUD for `userItem`,
   - parent-scoped lists for `itemOf`/`propertyOf`.
2. Only add custom views/actions when:
   - you need special filters,
   - or custom logic not covered by the generated ones.

