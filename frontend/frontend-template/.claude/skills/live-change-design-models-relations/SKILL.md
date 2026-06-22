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
- **`entity`** – global / role-scoped; do **not** pair with manual **`owner`** when **`userItem`** fits “my rows” for `client.user`.
- **`sessionOrUserItem`** / **`sessionOrUserProperty`** – owner is Session **or** User (no **`sessionItem`** annotation).
- **no relation** – for global data or other special cases.

Choose one main relation; other associations can be plain fields + indexes.

Decision guide: **`docs/docs/server/09-07-owner-selection-useritem.md`**.

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

## Property validation (validators)

- Built-in validator names live in `@live-change/framework/lib/utils/validators.js`. Do not invent names that are not there unless you also register them.
- Common patterns: `validation: ['nonEmpty']`, strings with `{ name: 'maxLength', length: 80 }`, numbers with `['number', 'integer', { name: 'min', value: 0 }, { name: 'max', value: 999 }]`.
- **Service-defined validators:** `definition.validator('email', factory)` (see `email-service/index.js` + `emailValidator.js`). Validators are merged across services at startup — avoid name clashes.
- **Frontend:** assign client factories to `api.validators` under the same keys (e.g. `clientEmailValidator.js` in `App.vue`). Match server error codes for i18n.
- Full reference: server manual page **Property validation** (`docs/docs/server/05a-validation.md`).

## Generated CRUD / views (relations-plugin)

- The plugin registers **views, actions, events, and triggers** automatically from `entity`, `itemOf`, `propertyOf`, `*Any`, `relatedTo`, `boundTo`, and `saveAuthor` (see `live-change-stack/framework/relations-plugin/src/index.ts`).
- **`propertyOf` + `writeAccessControl`:** generates **`set` + modelName**, **`update` + modelName**, **`setOrUpdate` + modelName** (e.g. `setBrowserViewportCalibration`), plus a default **object** read view named like the model with the first letter lowercased (e.g. **`browserViewportCalibration`**). Do not re-declare those names manually.
- **Do not** define a manual `definition.view` / `action` / `event` / `trigger` with the **same name** as a generated one (e.g. `entity` on model `Auction` already creates view **`auction`**).
- Use **`describe`** before adding custom surface API: `fnm exec -- node server/start.js describe --service myService --output yaml`.
- Technical inventory: **`docs/docs/server/09-00-relations-generated-artifacts.md`** (built docs path `/server/09-00-relations-generated-artifacts.html`).

## Owner selection — `userItem`, `entity`, domain relations

- **Per logged-in user** (“my X”, owner = `client.user`): use **`userItem`** (or **`userProperty`** for one row per user) with **`use: [ userService, … ]`**. Do **not** hand-declare **`user`** or **`owner`** — user-service injects **`user`** + **`byUser`**. Configure access with **`userReadAccess`**, **`userCreateAccess`**, **`userUpdateAccess`**, **`userDeleteAccess`**, **`userWriteAccess`** (see `live-change-stack/services/user-service/userItem.js`).
- **Session or User** (guest drafts → sign-in transfer): **`sessionOrUserItem`** / **`sessionOrUserProperty`**. There is no **`sessionItem`** annotation.
- **Global / role-scoped** catalog entities without a natural “this row belongs to client.user”: often **`entity`**.
- **Child of a domain parent model** (invoice lines, comments, …): **`itemOf`** / **`propertyOf`** / `*Any`.
- Typical **`userItem`** API names: **`myUser` + plural(Model)** (range), **`createMyUser` + Model**, **`updateMyUser` + Model**. Relations-plugin may also expose **`create` + Model** from underlying **`itemOf`** — prefer **`createMyUser*`** for consistent **`user`** stamping.
- Full guide: **`docs/docs/server/09-07-owner-selection-useritem.md`**.

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
2. Set **`userReadAccess`**, **`userCreateAccess`**, **`userUpdateAccess`**, **`userDeleteAccess`**, or **`userWriteAccess`** (see `live-change-stack/services/user-service/userItem.js`). Do **not** declare **`user`** in `properties`.

```js
userItem: {
  userReadAccess: (params, context) => !!context.client?.user,
  userWriteAccess: (params, context) => !!context.client?.user,
  writableProperties: ['name']
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

> **IMPORTANT — serialization constraint:** Function indexes are serialized via `toString()` and executed remotely. Module-scope imports and closures are `undefined` at runtime. Use either:
> - **inline helpers** inside the index function body (simple logic), or
> - **eval helper bundle**: a self-contained factory function passed as a string in `parameters` and restored with `eval(helperBundle)()` (same pattern as `dbAccessFunctions` in `access-control-service/access.js`).

```js
export function myDomainDbHelpers() {
  function deriveMonth(obj) { return obj.date?.slice(0, 7) }
  return { deriveMonth }
}

// parameters: { domainHelpers: `(${myDomainDbHelpers})`, tableName: '...' }
// inside index: const { deriveMonth } = eval(domainHelpers)()
```

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

