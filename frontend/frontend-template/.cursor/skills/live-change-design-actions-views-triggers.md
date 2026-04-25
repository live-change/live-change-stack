---
name: live-change-design-actions-views-triggers
description: Design actions, views, triggers with indexes and batch processing patterns
---

# Skill: live-change-design-actions-views-triggers (Claude Code)

Use this skill to design **actions, views, and triggers** in LiveChange services while making good use of indexes and avoiding full-table scans.

## Reads vs writes (CQRS-like)

**Frontend (Vue):** load data with `usePath` + `live` / `useFetch` on **views**. Do **not** use `api.command` or `useActions()` only to fetch, preview, or compute display-only values — add a `definition.view` on the server and read it on the client.

**Backend (services):** **`definition.view`** is the read surface (including computed or preview data). From triggers/actions use **`app.viewGet`** / **`app.serviceViewGet`** when you need the same view layer as the client, or direct model/index reads where appropriate. **Actions and triggers** change state via **`emit`** / **`trigger`** / **`triggerService`**, not via fake “read-only actions.”

## When to use

- You add or change actions on existing models.
- You define new views (especially list/range views).
- You implement triggers (online/offline, batch processing, async result flows).

## Step 1 – Design an action

1. **Clarify the goal**:
   - create / update / delete a record,
   - or create a “command” that will be completed later.
2. **Define `properties`** clearly:
   - only include what the client must provide,
   - fetch the rest from the database via indexes.
3. **Use indexes**, not full scans:
   - `indexObjectGet('bySomething', { ... })` for single-object lookups,
   - `indexRangeGet('bySomething', { ... })` for lists.
4. **Return a useful result**:
   - new object id,
   - session keys,
   - any data needed for the next step.

Example:

```js
definition.action({
  name: 'someAction',
  properties: {
    someKey: { type: String }
  },
  async execute({ someKey }, { client, service }) {
    const obj = await SomeModel.indexObjectGet('bySomeKey', { someKey })
    if(!obj) throw new Error('notFound')

    const id = app.generateUid()

    await SomeOtherModel.create({
      id
      // ...
    })

    return { id }
  }
})
```

## Step 2 – Design a view

1. Decide what kind of data source you have, then pick the **view variant** (exactly one):

| Variant | When to use |
| --- | --- |
| `daoPath` | Data is stored in the framework DAO (preferred). The framework auto-generates both `get` and `observable` from `daoPath`. |
| `get` + `observable` | External or custom reactive data source (eg. WebSocket client, RPC stream). **Both are required together.** |
| `fetch` | Remote, non-reactive request/response data (eg. GeoIP). Often paired with `remote: true`. |

2. Decide if you need:
   - a **single** object view, or
   - a **list/range** view.
3. Define `properties` for the view:
   - only parameters needed for filtering,
   - types consistent with model fields.
4. Prefer `daoPath` when you are reading from the DAO:
   - use model paths (`Model.path`, `Model.rangePath`, `Model.sortedIndexRangePath`, `Model.indexObjectPath`)
   - use `...App.rangeProperties` + `App.extractRange(props)` for range views

### Step 2a – RangeViewer/rangeBuckets compatibility

When a view is consumed by `RangeViewer` or `rangeBuckets`:

- prefer `Model.sortedIndexRangePath(...)` for index-backed list views,
- keep `App.extractRange(props)` as pagination cursor input,
- do not reinterpret `gt/gte/lt/lte` as domain filters.

Anti-patterns:

- using `indexRangePath` for frontend bucket pagination flow,
- injecting custom month/year bounds into cursor fields in frontend,
- rewriting cursor values in backend with unrelated filter semantics.

Preferred filtering strategy:

1. design index prefix for frequent filters,
2. use `App.utils.prefixRange` only as backend fallback,
3. keep string min/max hacks as last resort.

### Step 2b – Standalone indexes for union/equal sources

When index rows are built from multiple equal tables (union-like flow), do not force the index into one model definition.

Use `definition.index(...)` at service level (typically `indexes.js`) when:

- index combines rows from two or more source tables,
- source tables are peer entities (no natural single owner model),
- index is a projection layer for cross-table reads.

Example:

```js
definition.index({
  name: 'Urls',
  function: async (input, output) => {
    await input.table('url_Redirect').onChange((obj, oldObj) =>
      output.change(obj && mapRedirect(obj), oldObj && mapRedirect(oldObj))
    )
    await input.table('url_Canonical').onChange((obj, oldObj) =>
      output.change(obj && mapCanonical(obj), oldObj && mapCanonical(oldObj))
    )
  }
})
```

Decision rule:

- model-local index -> `definition.model({ indexes: ... })`,
- union/peer-source index -> standalone `definition.index(...)` in `indexes.js`.

### Example: `daoPath` (preferred, DAO-backed)

```js
definition.view({
  name: 'costInvoice',
  properties: {
    costInvoice: {
      type: String
    }
  },
  returns: { type: Object },
  async daoPath({ costInvoice }) {
    return CostInvoice.path(costInvoice)
  }
})
```

### Example: `get` + `observable` together (external / reactive)

```js
definition.view({
  name: 'session',
  properties: {},
  returns: { type: Number },
  async get(params, { client }) {
    return onlineClient.get(['online', 'session', { ...params, session: client.session }])
  },
  async observable(params, { client }) {
    return onlineClient.observable(
      ['online', 'session', { ...params, session: client.session }],
      ReactiveDao.ObservableValue
    )
  }
})
```

### Example: `fetch` (remote / non-reactive)

```js
definition.view({
  name: 'myCountry',
  properties: {},
  returns: { type: String },
  remote: true,
  async fetch(props, { client }) {
    return await getGeoIp(client.ip)
  }
})
```

### Anti-pattern: `get` without `observable` (do not do this)

```js
definition.view({
  name: 'brokenView',
  properties: {
    id: { type: String }
  },
  returns: { type: Object },
  async get({ id }) {
    return await SomeModel.get(id)
  }
})
```

## Step 3 – Online/offline triggers

1. Identify events:
   - session or connection goes online,
   - session or connection goes offline.
2. Define triggers with minimal `properties` (usually just an id).
3. Update only the necessary fields (`status`, `lastSeenAt`, etc.).

Example:

```js
definition.trigger({
  name: 'sessionConnectionOnline',
  properties: {
    connection: { type: String }
  },
  async execute({ connection }, { service }) {
    await Connection.update(connection, {
      status: 'online',
      lastSeenAt: new Date()
    })
  }
})

definition.trigger({
  name: 'sessionConnectionOffline',
  properties: {
    connection: { type: String }
  },
  async execute({ connection }, { service }) {
    await Connection.update(connection, {
      status: 'offline'
    })
  }
})
```

## Step 4 – Batch triggers (avoid full scans)

1. Pick a **batch size** (e.g. 32 or 128).
2. Use `rangeGet` with `gt: lastId` in a loop:
   - start with `last = ''`,
   - after each batch, set `last` to the last record’s id,
   - stop when the batch is empty.

Example:

```js
definition.trigger({
  name: 'allOffline',
  async execute({}, { service }) {
    let last = ''
    while(true) {
      const items = await Connection.rangeGet({
        gt: last,
        limit: 32
      })
      if(items.length === 0) break

      for(const item of items) {
        await Connection.update(item.id, { status: 'offline' })
      }

      last = items[items.length - 1].id
    }
  }
})
```

## Step 5 – Grant access on entity creation

When a model uses `entity` with `writeAccessControl` / `readAccessControl`, the auto-generated CRUD checks roles but does **not** grant them. Add a change trigger to grant the creator `'owner'` after creation:

```js
definition.trigger({
  name: 'changeMyService_MyModel',
  properties: {
    object: { type: MyModel, validation: ['nonEmpty'] },
    data: { type: Object },
    oldData: { type: Object }
  },
  async execute({ object, data, oldData }, { client, triggerService }) {
    if (!data || oldData) return   // only on create (data present, no oldData)
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

For publicly accessible objects, also call `accessControl_setPublicAccess`:

```js
await triggerService({ service: 'accessControl', type: 'accessControl_setPublicAccess' }, {
  objectType: 'myService_MyModel',
  object,
  userRoles: ['reader'],       // roles for all logged-in users
  sessionRoles: ['reader'],    // roles for all sessions (including anonymous)
  lastUpdate: new Date()
})
```

Key points:
- `objectType` format: `serviceName_ModelName` (e.g. `company_Company`, `uploadedFiles_File`)
- `sessionOrUserType`: `'user_User'` for logged-in users, `'session_Session'` for anonymous
- For anonymous users: `sessionOrUser: client.session`
- Use `Promise.all([...])` when setting both public and per-user access

## Step 6 – Pending + resolve pattern for async results

Use this pattern when an action initiates a command that will be completed by an external process (device, worker, etc.) and you want the action to wait with a timeout.

### Steps

1. Implement a helper module with an in-memory `Map`:
   - `waitForCommand(id, timeoutMs)` – returns a Promise,
   - `resolveCommand(id, result)` – resolves and clears timeout.
2. In the main action:
   - create a record with `status: 'pending'`,
   - call `waitForCommand(id, timeoutMs)` and `return` the result.
3. In the reporting action:
   - update the record (`status: 'completed'`, `result`),
   - call `resolveCommand(id, result)`.

Helper sketch:

```js
const pendingCommands = new Map()

export function waitForCommand(commandId, timeoutMs = 115000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingCommands.delete(commandId)
      reject(new Error('timeout'))
    }, timeoutMs)
    pendingCommands.set(commandId, { resolve, reject, timer })
  })
}

export function resolveCommand(commandId, result) {
  const pending = pendingCommands.get(commandId)
  if(pending) {
    clearTimeout(pending.timer)
    pendingCommands.delete(commandId)
    pending.resolve(result)
  }
}
```

