---
description: Rules for implementing actions, views, and triggers in LiveChange services
globs: **/services/**/*.js
---

# LiveChange backend – actions, views, triggers (Claude Code)

Use these rules when implementing actions, views, and triggers in LiveChange services.

## Actions

- Place actions in domain files, near the models they operate on.
- Each action should:
  - declare clear input `properties`,
  - perform minimal but necessary validation,
  - use indexes instead of full scans,
  - return a meaningful result (ids, data, etc.).

Example:

```js
definition.action({
  name: 'registerDeviceConnection',
  properties: {
    pairingKey: { type: String },
    connectionType: { type: String },
    capabilities: { type: Array }
  },
  async execute({ pairingKey, connectionType, capabilities }, { client, service }) {
    const device = await Device.indexObjectGet('byPairingKey', { pairingKey })
    if(!device) throw new Error('notFound')

    const id = app.generateUid()
    const sessionKey = app.generateUid() + app.generateUid()

    await DeviceConnection.create({
      id,
      device: device.id,
      connectionType,
      capabilities,
      sessionKey,
      status: 'offline'
    })

    return { connectionId: id, sessionKey }
  }
})
```

## Views

- Views should be simple query endpoints over models.
- Prefer `indexObjectGet` / `indexRangeGet` instead of scanning whole tables.

Example of a range view:

```js
definition.view({
  name: 'pendingCommands',
  properties: {
    connectionId: { type: String }
  },
  async get({ connectionId }, { client, service }) {
    return BotCommand.indexRangeGet('byConnectionAndStatus', {
      connection: connectionId,
      status: 'pending'
    })
  }
})
```

## Triggers – online/offline and batch updates

- Use triggers for reacting to events (e.g. connection online/offline, server startup).
- There are two typical patterns:
  - single-object triggers (update one record),
  - batch triggers (update many records safely).

Online/offline example:

```js
definition.trigger({
  name: 'sessionDeviceConnectionOnline',
  properties: {
    connection: { type: String }
  },
  async execute({ connection }, { service }) {
    await DeviceConnection.update(connection, {
      status: 'online',
      lastSeenAt: new Date()
    })
  }
})

definition.trigger({
  name: 'sessionDeviceConnectionOffline',
  properties: {
    connection: { type: String }
  },
  async execute({ connection }, { service }) {
    await DeviceConnection.update(connection, {
      status: 'offline'
    })
  }
})
```

### Batch processing – always paginate

- Never load “all rows” in one go.
- Use a fixed `limit` (e.g. 32 or 128) and a cursor (`gt: lastId`) in a loop.

```js
definition.trigger({
  name: 'allOffline',
  async execute({}, { service }) {
    let last = ''
    while(true) {
      const connections = await DeviceConnection.rangeGet({
        gt: last,
        limit: 32
      })
      if(connections.length === 0) break

      for(const conn of connections) {
        await DeviceConnection.update(conn.id, { status: 'offline' })
      }

      last = connections[connections.length - 1].id
    }
  }
})
```

## Change triggers – reacting to model changes

Models with relations (`propertyOf`, `itemOf`, `userItem`, etc.) automatically fire change triggers on every create/update/delete. The naming convention is `{changeType}{ServiceName}_{ModelName}`:

- `changeSvc_Model` — fires on any change (recommended, covers all cases)
- `createSvc_Model` / `updateSvc_Model` / `deleteSvc_Model` — specific lifecycle

Parameters: `{ objectType, object, identifiers, data, oldData, changeType }`.

```js
// React to any change in Schedule model from cron service
definition.trigger({
  name: 'changeCron_Schedule',
  properties: {
    object: { type: Schedule, validation: ['nonEmpty'] },
    data: { type: Object },
    oldData: { type: Object }
  },
  async execute({ object, data, oldData }, { triggerService }) {
    if(oldData) { /* cleanup old state */ }
    if(data) { /* setup new state */ }
  }
})
```

Check `data`/`oldData`: both present = update, only `data` = create, only `oldData` = delete.

## Granting access on object creation

When a model uses `entity` with `writeAccessControl` / `readAccessControl`, the auto-generated CRUD checks roles but does **not** grant them automatically. The creator must be explicitly granted roles — typically `'owner'` — otherwise they cannot access their own object.

Use a change trigger that fires on creation (`data` exists, `oldData` does not):

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

Key details:
- `objectType` format: `serviceName_ModelName` (e.g. `company_Company`)
- For public access (readable by everyone), use `accessControl_setPublicAccess` with `userRoles` / `sessionRoles`
- For anonymous users, use `sessionOrUserType: 'session_Session'` and `sessionOrUser: client.session`

## Pending + resolve pattern (async result)

Use this pattern when an action must wait for a result from an external process (device, worker, etc.).

1. The main action creates a “pending” record and calls `waitForCommand(id, timeoutMs)`.
2. Another action or trigger updates the record and calls `resolveCommand(id, result)`.

In-memory helper:

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

Usage in an action:

```js
await SomeCommand.create({ id, status: 'pending', ... })
const result = await waitForCommand(id)
return result
```

And in a reporting action:

```js
await SomeCommand.update(id, {
  status: 'completed',
  result
})
resolveCommand(id, result)
```

