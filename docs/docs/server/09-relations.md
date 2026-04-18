---
title: Relations
---

# Relations

Relations attach models to an “owner” or parent so that each record belongs to a user, session, another model, or a polymorphic target. They add identifiers (e.g. user, billing, sessionOrUserType/sessionOrUser), indexes, events, actions, and views for CRUD scoped to that owner. Access is controlled via read/write/create/update/delete access settings.

Two groups:

1. **Relations plugin** (`@live-change/relations-plugin`) — Generic relations that work with any parent model:
   - [propertyOf and itemOf](/server/09-01-propertyOf-itemOf.html) — Single child per parent (property) or many children per parent (item).
   - [propertyOfAny and itemOfAny](/server/09-02-propertyOfAny-itemOfAny.html) — Same idea with a polymorphic parent (one of several types).
   - [boundTo and relatedTo](/server/09-06-boundTo-relatedTo.html) — Additional relation types.

2. **User service** (`@live-change/user-service`) — Relations that depend on User/Session/Contact and sign-in/transfer behavior:
   - [userProperty and userItem](/server/09-03-userProperty-userItem.html) — One property or many items per User.
   - [sessionOrUserProperty and sessionOrUserItem](/server/09-04-sessionOrUserProperty-sessionOrUserItem.html) — Owner is either Session or User; supports transfer on sign-in and extended identifiers (e.g. giver).
   - [contactOrUserProperty and contactOrUserItem](/server/09-05-contactOrUserProperty-contactOrUserItem.html) — Owner is Contact or User; supports contact types (email, phone) and transfer on connect.

Use **use: [ relationsPlugin ]** and/or **use: [ userService ]** in your service definition when you use these annotations.

## Arity rules (annotation vs parent tuple)

There are two independent arity dimensions:

1. **Annotation arity** — whether an annotation can be a single config object or a list of config objects.
2. **Parent tuple arity** — whether one config may point to multiple parents (`what: [A, B]`) or multiple polymorphic dimensions (`to: ['owner', 'topic']`).

| Relation annotation | Annotation arity | Parent tuple arity |
|---|---|---|
| `propertyOf` | single config only | `what` may be one model or tuple: `what: [A, B, ...]` |
| `itemOf` | single config only | `what` may be one model or tuple: `what: [A, B, ...]` |
| `boundTo` | single config only | `what` may be one model or tuple: `what: [A, B, ...]` |
| `relatedTo` | single config or config list | each config uses `what`, which may be one model or tuple |
| `propertyOfAny` | single config only | `to` may contain one or many dimensions |
| `itemOfAny` | single config only | `to` may contain one or many dimensions |
| `boundToAny` | single config only | `to` may contain one or many dimensions |
| `relatedToAny` | single config or config list | each config uses `to`, which may contain one or many dimensions |

Examples:

- `propertyOf` multi-parent tuple: `propertyOf: { what: [Device, Session] }`
- `relatedTo` multiple configs: `relatedTo: [{ what: Device }, { what: Team }]`

## Auto-added fields and indexes

Every relation automatically adds **identifier fields** and **indexes** to the model. You do **not** need to define these in `properties` — they are injected by the relations plugin.

### Naming convention

The field name is the parent model name with the first letter lowercased:
- `Device` → `device`
- `CostInvoice` → `costInvoice`
- `User` → `user`

You can override this with `propertyNames` in the relation config.

### Fixed-type relations

For relations where the parent type is known at definition time (`propertyOf`, `itemOf`, `boundTo`, `relatedTo`):

| Relation | Field(s) added | Index(es) | Notes |
|---|---|---|---|
| `propertyOf: { what: Device }` | `device` | `byDevice` | ID = parent ID |
| `itemOf: { what: Device }` | `device` | `byDevice` | Many children per parent |
| `propertyOf: { what: [A, B] }` | `a`, `b` | `byA`, `byB`, `byAAndB` | Multi-parent tuple, all index combinations |
| `userItem` | `user` | `byUser` | Internally becomes `itemOf: { what: User }` |
| `userProperty` | `user` | `byUser` | Internally becomes `propertyOf: { what: User }` |
| `boundTo: { what: Device }` | `device` | `byDevice` (hash) | One-directional pointer |
| `relatedTo: { what: Device }` | `device` | `byDevice` | Many-to-many |

Each field has `type: ParentModelType` and `validation: ['nonEmpty']`.

### Polymorphic relations

For relations where the parent type varies at runtime (`propertyOfAny`, `itemOfAny`, `sessionOrUserProperty`, etc.), **two fields** are added per identifier — a type discriminator and the value:

| Relation | Fields added | Index(es) |
|---|---|---|
| `propertyOfAny: { to: ['owner'] }` | `ownerType`, `owner` | `byOwner` (hash) |
| `itemOfAny: { to: ['owner'] }` | `ownerType`, `owner` | `byOwner` (hash) |
| `sessionOrUserProperty` | `sessionOrUserType`, `sessionOrUser` | `bySessionOrUser` (hash) |
| `sessionOrUserItem` | `sessionOrUserType`, `sessionOrUser` | `bySessionOrUser` (hash) |
| `contactOrUserProperty` | `contactOrUserType`, `contactOrUser` | `byContactOrUser` (hash) |
| `boundToAny: { to: ['target'] }` | `targetType`, `target` | `byTarget` (hash) |

The `Type` field has `type: 'type'` with an enum of possible types. The value field has `type: 'any'`.

With `extendedWith`, additional type+value pairs are added (e.g. `sessionOrUserProperty: { extendedWith: ['object'] }` adds `objectType` + `object`).

### Important: do not re-declare auto-added fields

Do **not** add the identifier fields to your `properties` block — they are already added by the relation. Adding them again can cause conflicts.

```javascript
// ❌ Wrong — 'device' is already added by itemOf
definition.model({
  name: 'Connection',
  properties: {
    device: { type: String },  // ❌ redundant, auto-added by itemOf
    status: { type: String }
  },
  itemOf: { what: Device }
})

// ✅ Correct — only define your own fields
definition.model({
  name: 'Connection',
  properties: {
    status: { type: String }
  },
  itemOf: { what: Device }  // automatically adds 'device' field + 'byDevice' index
})
```

Use `node server/start.js describe --service myService --model MyModel --output yaml` to see all fields and indexes including auto-added ones.
