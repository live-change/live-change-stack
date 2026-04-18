---
description: Event-sourcing data flow rules — emit events for DB writes, use triggerService for cross-service writes
globs: **/services/**/*.js, **/server/**/*.js, server/**/*.js
---

# LiveChange backend – event-sourcing data flow (Claude Code)

Use these rules when implementing actions, triggers, and events in LiveChange services.

## How data flows in LiveChange

LiveChange uses an event-sourcing pattern:

1. **Actions and triggers** validate input and publish events via `emit()`.
2. **Events** (`definition.event()`) execute and perform actual database writes (`Model.create`, `Model.update`, `Model.delete`).
3. For models with **relations** (`userItem`, `itemOf`, `propertyOf`, etc.), the relations plugin auto-generates CRUD events and triggers — use those via `triggerService()`.
4. For **cross-service writes**, always use `triggerService()` — `foreignModel` is read-only.

```
Action/Trigger  ──emit()──▶  Event handler  ──▶  Model.create/update/delete
       │
       └──triggerService()──▶  Other service's trigger  ──emit()──▶  ...
```

## Rule 1: No direct Model.create/update/delete in actions or triggers

Actions and triggers must **not** call `Model.create()`, `Model.update()`, or `Model.delete()` directly. Instead:

- **If the model has relations** (auto-generated CRUD) → use `triggerService()` to call the relation-declared trigger (e.g. `serviceName_createModelName`, `serviceName_updateModelName`, `serviceName_setModelName`).
- **If no relation trigger exists** → use `emit()` to publish an event, then define a `definition.event()` handler that performs the DB write.

### Correct: emit an event from an action

```js
definition.action({
  name: 'createImage',
  properties: { /* ... */ },
  waitForEvents: true,
  async execute({ image, name, width, height }, { client, service }, emit) {
    const id = image || app.generateUid()
    // validation, business logic...
    emit({
      type: 'ImageCreated',
      image: id,
      data: { name, width, height }
    })
    return id
  }
})

definition.event({
  name: 'ImageCreated',
  async execute({ image, data }) {
    await Image.create({ ...data, id: image })
  }
})
```

### Correct: use triggerService for relation-declared triggers

```js
definition.action({
  name: 'giveCard',
  properties: { /* ... */ },
  async execute({ receiverType, receiver }, { client, triggerService }, emit) {
    // Use the auto-generated trigger from the relations plugin
    await triggerService({
      service: definition.name,
      type: 'businessCard_setReceivedCard',
    }, {
      sessionOrUserType: receiverType,
      sessionOrUser: receiver,
      // ...
    })
  }
})
```

### Wrong: direct DB write in an action

```js
// ❌ DON'T DO THIS
definition.action({
  name: 'createSomething',
  async execute({ name }, { client }, emit) {
    const id = app.generateUid()
    await Something.create({ id, name })  // ❌ direct write in action
    return id
  }
})
```

## Rule 2: Events can only modify same-service models

Event handlers (`definition.event()`) must only write to models defined in the **same service**. Never attempt to write to a `foreignModel` — it is read-only (supports `.get()`, `.indexObjectGet()`, `.indexRangeGet()` but not `.create()`, `.update()`, `.delete()`).

For cross-service writes, use `triggerService()` from the action or trigger (before emitting):

```js
// ✅ Correct: cross-service write via triggerService
definition.trigger({
  name: 'chargeCollected_billing_TopUp',
  async execute(props, { triggerService }, emit) {
    // Write to another service via its declared trigger
    await triggerService({
      service: 'balance',
      type: 'balance_setOrUpdateBalance',
    }, { ownerType: 'billing_Billing', owner: props.cause })

    // Write to own service via triggerService (relation-declared trigger)
    await triggerService({
      service: definition.name,
      type: 'billing_updateTopUp'
    }, { topUp: props.cause, state: 'paid' })
  }
})
```

```js
// ❌ DON'T DO THIS — foreignModel is read-only
const ExternalModel = definition.foreignModel('otherService', 'SomeModel')

definition.event({
  name: 'SomethingHappened',
  async execute({ id }) {
    await ExternalModel.update(id, { status: 'done' })  // ❌ will fail
  }
})
```

## `waitForEvents: true`

When an action or trigger emits events and needs them processed before returning a result, set `waitForEvents: true`:

```js
definition.action({
  name: 'createNotification',
  waitForEvents: true,
  async execute({ message }, { client }, emit) {
    const id = app.generateUid()
    emit({
      type: 'created',
      notification: id,
      data: { message, sessionOrUserType: 'user_User', sessionOrUser: client.user }
    })
    return id  // event is processed before this returns
  }
})
```

Without `waitForEvents: true`, the action returns immediately and events are processed asynchronously.

## Relation-declared triggers

When a model uses relations (`userItem`, `itemOf`, `propertyOf`, etc.), the relations plugin auto-generates CRUD triggers. Use `describe` to discover them:

```bash
fnm exec -- node server/start.js describe --service myService --output yaml
```

Common auto-generated trigger patterns:
- `serviceName_createModelName` — create a new record
- `serviceName_updateModelName` — update an existing record
- `serviceName_deleteModelName` — delete a record
- `serviceName_setModelName` — create or update (upsert)
- `serviceName_setOrUpdateModelName` — set if not exists, update if exists

Invoke them via `triggerService()`:

```js
await triggerService({
  service: 'myService',
  type: 'myService_createMyModel'
}, {
  // properties matching the model's writeable fields
})
```

## Summary

| Where | Can call Model.create/update/delete? | How to change data |
|---|---|---|
| `definition.event()` | ✅ Yes (same-service models only) | Direct DB writes |
| `definition.action()` | ❌ No | `emit()` or `triggerService()` |
| `definition.trigger()` | ❌ No | `emit()` or `triggerService()` |
| Cross-service | ❌ Never via foreignModel | `triggerService()` to target service |
