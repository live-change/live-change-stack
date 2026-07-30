---
title: propertyOf and itemOf
---

# propertyOf and itemOf

From **relations plugin** (`use: [ relationsPlugin ]`).

- **propertyOf** — One child record per parent (e.g. one Settings per Session, one Balance per owner). Adds a single identifier (e.g. billing, session) and Set/Update/Reset events and actions.
- **itemOf** — Many child records per parent (e.g. many TopUp per Billing, many Operation per Balance). Adds parent identifier and Created/Updated/Deleted events and actions, plus range views.

## Arity rules

- `propertyOf` and `itemOf` are **single-config annotations**. Use one config object, not a list of config objects.
- Inside that config, `what` may be:
  - one parent model (`what: Billing`)
  - a parent tuple (`what: [Billing, Session]`)

Valid:

```javascript
propertyOf: {
  what: [A, B]
}
```

Invalid:

```javascript
// do not use a list of relation config objects here
propertyOf: [configA, configB]
```

## Auto-added fields

Both `propertyOf` and `itemOf` automatically add identifier fields and indexes to the model. **Do not re-declare these in `properties`.**

The field name is derived from the parent model name with the first letter lowercased:

| Relation | Field added | Index added | ID behavior |
|---|---|---|---|
| `propertyOf: { what: Billing }` | `billing` | `byBilling` | ID = parent ID |
| `itemOf: { what: Billing }` | `billing` | `byBilling` | Own ID |
| `propertyOf: { what: [A, B] }` | `a`, `b` | `byA`, `byB`, `byAAndB` | Composite ID |

Each auto-added field has `type: ParentModelType` and `validation: ['nonEmpty']`.

For multi-parent relations, all combinations of indexes are auto-created. You can override field names with `propertyNames` in the config.

Example — `itemOf: { what: Billing }` adds `billing` field automatically:

```javascript
const TopUp = definition.model({
  name: "TopUp",
  itemOf: {
    what: Billing,         // auto-adds: billing field + byBilling index
    readAccessControl: { roles: ['owner', 'admin'] }
  },
  properties: {
    // only define YOUR fields — 'billing' is already added by itemOf
    value: { type: Number },
    price: { type: Number },
    state: { type: String, default: 'created' }
  }
})
```

## propertyOf — configuration

```javascript
model.propertyOf = {
  what: ParentModel,   // the parent model (e.g. Session, Billing)
  readAccess?: AccessSpecification,
  writeAccess?: AccessSpecification,
  listAccess?: AccessSpecification,
  setAccess?: AccessSpecification,
  updateAccess?: AccessSpecification,
  setOrUpdateAccess?: AccessSpecification,
  resetAccess?: AccessSpecification,
  readAllAccess?: AccessSpecification,
  singleAccess?: AccessSpecification,
  singleAccessControl?: AccessControlSettings,
  readAccessControl?: AccessControlSettings,
  writeAccessControl?: AccessControlSettings,
  listAccessControl?: AccessControlSettings,
  setAccessControl?: AccessControlSettings,
  updateAccessControl?: AccessControlSettings,
  resetAccessControl?: AccessControlSettings,
  setOrUpdateAccessControl?: AccessControlSettings,
  views?: [{ type: 'range' | 'object', internal?: boolean, readAccess?, readAccessControl?, fields? }]
}
```

## itemOf — configuration

```javascript
model.itemOf = {
  what: ParentModel,
  readAccess?: AccessSpecification,
  writeAccess?: AccessSpecification,
  createAccess?: AccessSpecification,
  updateAccess?: AccessSpecification,
  deleteAccess?: AccessSpecification,
  copyAccess?: AccessSpecification,
  readAllAccess?: AccessSpecification,
  readAccessControl?: AccessControlSettings,
  writeAccessControl?: AccessControlSettings,
  createAccessControl?: AccessControlSettings,
  updateAccessControl?: AccessControlSettings,
  deleteAccessControl?: AccessControlSettings,
  copyAccessControl?: AccessControlSettings,
  readAllAccessControl?: AccessControlSettings,
  /// Cascade delete when parent is removed — see [Cascade delete](#cascade-delete-deletecascade)
  deleteCascade?: {
    async?: boolean,
    bucketSize?: number,
    deleteBucketSize?: number,
    delayMs?: number,
    fireChildChangeTriggers?: boolean
  }
}
```

## Cascade delete (`deleteCascade`)

When a parent is deleted, the relations plugin cascades to children via parent-delete triggers and `*DeleteByOwner` events. Configure this on the **child** relation (`itemOf` / `propertyOf` / `*Any`), not on the parent model.

```javascript
const Scan = definition.model({
  name: 'Scan',
  itemOf: {
    what: Scanner,
    deleteCascade: {
      async: true,                     // fire-and-forget — parent delete command returns quickly
      bucketSize: 32,                  // children iteration (default 32)
      deleteBucketSize: 128,           // physical deletes in DeleteByOwner (default 128)
      delayMs: 0                       // optional pause after each bucket
      // fireChildChangeTriggers: false  // only for leaves — otherwise grandchildren are not cascaded
    }
  }
})
```

| Field | Default | Meaning |
|---|---|---|
| `async` | `false` | If `true`, the parent-delete trigger returns immediately and cascade runs in the background (independent of the parent command `waitForEvents`) |
| `bucketSize` | `32` | Page size when iterating children for change triggers |
| `deleteBucketSize` | `128` | Page size when deleting rows in `*DeleteByOwner` |
| `delayMs` | `0` | Delay after each bucket |
| `fireChildChangeTriggers` | `true` | If `false`, only emit `*DeleteByOwner` (no per-child `fireChangeTriggers`). Use `false` only for **leaf** models — `runtime.delete` does not cascade further |

Physical `runtime.delete` calls always go through a **global process-wide PQueue** (default concurrency `4`) so large cascades do not spam the database.

```javascript
import {
  getDeleteCascadeQueue,
  configureDeleteCascadeQueue,
  enqueueDeleteCascade
} from '@live-change/relations-plugin'

configureDeleteCascadeQueue({ concurrency: 2 })

// Optional: add your own cleanup jobs to the same queue
await enqueueDeleteCascade(async () => { /* ... */ })
```

See also [Relations generated artifacts](/server/09-00-relations-generated-artifacts.html) for the public queue API.

## Example: itemOf (TopUp per Billing)

```javascript
// Source: live-change-stack/services/billing-service/topUp.js

const TopUp = definition.model({
  name: "TopUp",
  itemOf: {
    what: Billing,
    readAccessControl: { roles: ['owner', 'admin'] }
  },
  properties: {
    value: { type: Number },
    price: { type: Number },
    currency: { type: String },
    state: { type: String, options: ['created', 'paid', 'failed', 'refunded'], default: 'created' }
  }
})
```

## Example: itemOf (Operation per Balance)

```javascript
// Source: live-change-stack/services/balance-service/operation.js

const Operation = definition.model({
  name: "Operation",
  itemOf: {
    what: Balance,
    readAccessControl: { roles: ['owner', 'admin'] }
  },
  properties: {
    state: { type: String, options: ['started', 'finished', 'canceled'] },
    causeType: { type: String, validation: ['nonEmpty'] },
    cause: { type: String, validation: ['nonEmpty'] },
    change: config.currencyType,
    amountBefore: config.currencyType,
    amountAfter: config.currencyType,
    updatedAt: { ... }
  }
})
```

## propertyOf in session-service

Session-service uses a **processor** that turns **sessionProperty** into **propertyOf** with `what: Session` and adds views/actions (mySessionXxx, setMySessionXxx, etc.). So “session property” is implemented as propertyOf Session.
