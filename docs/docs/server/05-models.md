---
title: Models
---

# Models

Models are defined with **definition.model({ name, properties, indexes, ... })**. They define the shape of stored entities and optional indexes for range/list queries. This section describes **bare models** only; ownership and relations (userProperty, itemOf, sessionOrUserProperty, etc.) are described in [Relations](/server/09-relations.html).

## Bare model with entity access (Event)

Global entity with role-based access (no per-user “owner” field):

```javascript
// Source: speed-dating/server/speed-dating-service/event.js (excerpt)

export const Event = definition.model({
  name: "Event",
  entity: {
    writeAccessControl: { roles: adminRoles },
    readAccessControl: { roles: [] }
  },
  properties: {
    name: { type: String, softValidation: ['nonEmpty', { name: 'maxLength', length: 128 }] },
    description: { type: String, input: 'textarea', ... },
    startTime: { type: Date, default: () => new Date(Date.now() + 1000 * 60 * 60 * 24), input: 'datetime' },
    autoStart: { type: Boolean, default: false },
    phases: {
      type: Array,
      of: phaseType,
      default: () => JSON.parse(JSON.stringify(defaultPhases)),
      softValidation: ['nonEmpty']
    },
    hubCoopAuthenticationSupport: { type: Boolean, default: false }
  },
  indexes: {
    byStartTime: { property: 'startTime' }
  }
})
```

## Bare model with properties and indexes (Transaction)

No ownership annotation; indexes for lookups and ranges:

```javascript
// Source: ipi-web/scan/server/scan-service/model.js (excerpt)

const Transaction = definition.model({
  name: 'Transaction',
  properties: {
    height: { type: Number },
    time: { type: Date },
    hash: { type: String },
    gasUsed: { type: Number },
    events: { type: Array, of: { type: Object, properties: { type: { type: String }, attributes: { type: Object } } } },
    inputs: { type: Array, of: { type: Object, properties: { address: { type: String }, amount: { type: String }, denom: { type: String } } } },
    outputs: { type: Array, of: { ... } },
    participants: { type: Array, of: { type: String } }
  },
  indexes: {
    byTime: { property: 'time' },
    byHash: { property: 'hash' },
    byParticipants: { property: 'participants', multi: true }
  }
})
```

## Convention: objectType and object

When referring to another entity (e.g. in access control, triggers, or payloads), the framework and services often use a pair of fields:

- **objectType** — The type of the object, usually as `serviceName_ModelName` (e.g. `billing_TopUp`, `user_User`, `speedDating_Event`).
- **object** — The id of that object.

Example in view accessControl:

```javascript
// Source: live-change-stack/services/billing-service/topUp.js

accessControl: {
  roles: ['owner'],
  objects: (props) => [{
    objectType: definition.name + '_TopUp',
    object: props.topUp
  }]
}
```

Example in trigger payload (causeType / cause):

```javascript
causeType: 'billing_TopUp',
cause: topUp.id
```

The same pattern appears as **ownerType** / **owner**, **causeType** / **cause**, **sessionOrUserType** / **sessionOrUser**, etc.: one field holds the type name, the other the id. Use **App.encodeIdentifier([type, id])** when you need a single composite key (e.g. for path or id).

## Property options

- **type** — String, Number, Boolean, Date, Object, Array, or custom (e.g. 'Image'). For polymorphic references use `type: 'type'` and `type: 'any'` (type name + id).
- **validation** / **softValidation** — e.g. `['nonEmpty']`, `{ name: 'maxLength', length: 80 }`, `['integer']`.
- **default** — Static value or function `() => value`.
- **options** — Allowed values for enums.
- **if** — Conditional visibility (e.g. `App.isomorphic(() => ...)` for dependent fields).
- **updated** — Function returning new value on update (e.g. `stateUpdatedAt: { type: Date, updated: () => new Date() }`).

## Indexes

- **property** — Single key (string) or array of keys for composite index.
- **multi** — If true, one record can appear under multiple index keys (e.g. array property like participants).
