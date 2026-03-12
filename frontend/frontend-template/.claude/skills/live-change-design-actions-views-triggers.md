---
description: Design actions, views, triggers with indexes and batch processing patterns
---

# Skill: live-change-design-actions-views-triggers (Claude Code)

Use this skill to design **actions, views, and triggers** in LiveChange services while making good use of indexes and avoiding full-table scans.

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

1. Decide if you need:
   - a **single** object view, or
   - a **list/range** view.
2. Define `properties` for the view:
   - only parameters needed for filtering,
   - types consistent with model fields.
3. Use the right primitive:
   - `get` / `indexObjectGet` for single object,
   - `indexRangeGet` for lists.

Range view example:

```js
definition.view({
  name: 'myItemsByStatus',
  properties: {
    status: { type: String }
  },
  async get({ status }, { client, service }) {
    return MyModel.indexRangeGet('byStatus', { status })
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

## Step 5 – Pending + resolve pattern for async results

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

