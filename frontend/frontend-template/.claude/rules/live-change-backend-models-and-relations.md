---
description: Rules for defining models, relations, indexes and access control in LiveChange
globs: **/services/**/*.js, **/server/**/*.js, server/**/*.js
---

# LiveChange backend – models and relations (Claude Code)

Use these rules when defining or editing models and relations in LiveChange services.

## General style for models

- Put models in domain files imported from the service `index.js`.
- Prefer **readable, multi-line** property definitions.
- Avoid squeezing `type`, `default`, `validation` into a single unreadable line.

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

## Relation arity (critical)

Always separate:

- **annotation arity** — can the annotation be a list of configs
- **parent tuple arity** — can one config include multiple parents/dimensions

| Relation | Annotation arity | Parent tuple arity |
|---|---|---|
| `propertyOf`, `itemOf`, `boundTo` | single config only | `what` can be one model or `[A, B, ...]` |
| `relatedTo` | single config or config list | each config uses `what` with one model or `[A, B, ...]` |
| `propertyOfAny`, `itemOfAny`, `boundToAny` | single config only | `to` can contain one or many names |
| `relatedToAny` | single config or config list | each config uses `to` with one or many names |

Guardrail:

- valid: `propertyOf: { what: [A, B] }`
- invalid: `propertyOf: [configA, configB]`

## `userItem` – belongs to the signed-in user

Use when the model is owned by the currently signed-in user.

```js
definition.model({
  name: 'Device',
  properties: {
    name: {
      type: String
    }
  },
  userItem: {
    readAccessControl: { roles: ['owner', 'admin'] },
    writeAccessControl: { roles: ['owner', 'admin'] },
    writeableProperties: ['name']
  }
})
```

This automatically generates:

- “my X” views (list + single),
- basic CRUD actions for the owner.

## `itemOf` – child belongs to a parent

Use for lists of items related to another model.

```js
definition.model({
  name: 'DeviceConnection',
  properties: {
    connectionType: {
      type: String
    },
    status: {
      type: String,
      default: 'offline'
    }
  },
  itemOf: {
    what: Device,
    readAccessControl: { roles: ['owner', 'admin'] },
    writeAccessControl: { roles: ['owner', 'admin'] }
  }
})
```

Guidelines:

- `what` must point to a model defined earlier (in this or another service).
- The relation generates standard views/actions for listing and managing children.

## `propertyOf` – one-to-one property, id = parent id

Use when the model represents a single “state object” for a parent, with the same id.

```js
definition.model({
  name: 'DeviceCursorState',
  properties: {
    x: { type: Number },
    y: { type: Number }
  },
  propertyOf: {
    what: Device,
    readAccessControl: { roles: ['owner', 'admin'] },
    writeAccessControl: { roles: ['owner', 'admin'] }
  }
})
```

Effects:

- You can fetch it directly as `DeviceCursorState.get(deviceId)`.
- No need for an extra `device` field or index for lookups by parent id.

## `propertyOf` with multiple parents (1:1 link to each)

Sometimes a model is a dedicated 1:1 link between entities (for example: invoice ↔ contractor in a specific role).
Most commonly this is 1–2 parents, but `what` can point to **any number** of parent models (including 3+), if that matches the domain semantics.

In that case:

- avoid storing the “other side id” as a plain `contractorId` / `someId` property
- avoid adding ad-hoc `...Id` fields in a relation model just to “join” entities — CRUD/relations generators won’t treat it as a relation
- instead, define the relation as `propertyOf` to **each** parent so the relations/CRUD generator understands the model is connecting entities.

Example (schematic):

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

## `foreignModel` – parent from another service

Use when `itemOf` / `propertyOf` refers to a model from a different service.

```js
const Device = definition.foreignModel('deviceManager', 'Device')

definition.model({
  name: 'BotSession',
  properties: {
    // ...
  },
  itemOf: {
    what: Device,
    readAccessControl: { roles: ['owner', 'admin'] }
  }
})
```

Notes:

- First argument is the service name.
- Second is the model name in that service.

## Auto-added fields from relations

Relations automatically add **identifier fields** and **indexes** to the model. Do **not** re-declare these in `properties`.

**Naming convention:** field name = parent model name with first letter lowercased (`Device` → `device`, `CostInvoice` → `costInvoice`).

| Relation | Field(s) auto-added | Index(es) auto-added |
|---|---|---|
| `itemOf: { what: Device }` | `device` | `byDevice` |
| `propertyOf: { what: Device }` | `device` | `byDevice` |
| `userItem` | `user` | `byUser` |
| `userProperty` | `user` | `byUser` |
| `sessionOrUserProperty` | `sessionOrUserType`, `sessionOrUser` | `bySessionOrUser` (hash) |
| `sessionOrUserProperty: { extendedWith: ['object'] }` | + `objectType`, `object` | composite indexes |
| `propertyOfAny: { to: ['owner'] }` | `ownerType`, `owner` | `byOwner` (hash) |
| `boundTo: { what: Device }` | `device` | `byDevice` (hash) |

For multi-parent relations (e.g. `propertyOf: { what: [A, B] }`), all index combinations are created (`byA`, `byB`, `byAAndB`).

```js
// ✅ Correct — only define YOUR fields
definition.model({
  name: 'Connection',
  properties: {
    status: { type: String }  // 'device' is NOT here — auto-added by itemOf
  },
  itemOf: { what: Device }   // adds 'device' field + 'byDevice' index
})

// ❌ Wrong — redundant field
definition.model({
  name: 'Connection',
  properties: {
    device: { type: String },  // ❌ already added by itemOf
    status: { type: String }
  },
  itemOf: { what: Device }
})
```

Use `fnm exec -- node server/start.js describe --service myService --model MyModel --output yaml` (from the app root, with fnm — see `live-change-node-toolchain-fnm`) to see all fields including auto-added ones.

## Indexes

- Declare indexes explicitly when you frequently query by a field or field combination.
- Use descriptive names like `bySessionKey`, `byDeviceAndStatus`, etc.

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

In other services, the same index may be visible with a prefixed name such as `myService_Model_byDeviceAndStatus`.

### When index should be outside a model

If an index is a union/projection over multiple peer tables (no single natural owner model), do not force it into `model.indexes`.

- Use service-level `definition.index(...)` (prefer a dedicated `indexes.js` file).
- Keep `model.indexes` for indexes semantically owned by one model.

### Function index serialization constraint

Function indexes (both `definition.index({ function })` and model `indexes: { name: { function } }`) are **serialized via `toString()`** and run on a remote server. All helpers, mappers, and variables used inside the function **must be defined inside the function body**. References to outer scope (module-level functions, imports, closures) will be `undefined` at runtime.

```js
// ❌ BROKEN — mapper defined outside, invisible after serialization
const mapper = obj => ({
  id: obj.name + '_' + obj.id, to: obj.id
})
indexes: {
  byDerived: {
    function: async (input, output, { tableName }) => {
      const table = await input.table(tableName)
      await table.map(mapper).to(output)  // mapper is undefined!
    }
  }
}

// ✅ CORRECT — mapper defined inside the function
indexes: {
  byDerived: {
    function: async (input, output, { tableName }) => {
      const mapper = obj => ({
        id: obj.name + '_' + obj.id, to: obj.id
      })
      const table = await input.table(tableName)
      await table.map(mapper).to(output)
    }
  }
}
```

## Access control on relations

- Always set `readAccessControl` and `writeAccessControl` on relations (`userItem`, `itemOf`, `propertyOf`).
- Treat access control as part of the model definition, not an afterthought.

## `entity` models – granting access on creation

Models with `entity` and `writeAccessControl` / `readAccessControl` check roles on every CRUD operation, but do **not** auto-grant roles to the creator. You must add a change trigger to grant the creator `'owner'` (or other roles) after creation:

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
      objectType: 'myService_MyModel',
      object,
      roles: ['owner'],
      sessionOrUserType: 'user_User',
      sessionOrUser: client.user,
      lastUpdate: new Date()
    })
  }
})
```

Without this trigger, the creator cannot read or modify their own object. The `objectType` format is `serviceName_ModelName`.

