---
description: Rules for defining models, relations, indexes and access control in LiveChange
globs: **/services/**/*.js
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
Most commonly this is 1–2 parents, but `propertyOf` can point to **any number** of parent models (including 3+), if that matches the domain semantics.

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
  propertyOf: [
    { what: CostInvoice },
    { what: Contractor }
  ]
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

## Access control on relations

- Always set `readAccessControl` and `writeAccessControl` on relations (`userItem`, `itemOf`, `propertyOf`).
- Treat access control as part of the model definition, not an afterthought.

