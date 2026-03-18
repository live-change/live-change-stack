---
title: Events
---

# Events

Events are the mechanism through which database state changes in LiveChange. Actions and triggers publish events via `emit()`, and event handlers (`definition.event()`) execute the actual `Model.create`, `Model.update`, and `Model.delete` operations.

This event-sourcing pattern ensures that all state changes are recorded and can be replayed.

## Defining an event handler

```javascript
definition.event({
  name: 'EventName',
  async execute(params) {
    // Perform database writes here
    await SomeModel.create({ id: params.id, ...params.data })
  }
})
```

The `execute` function receives the properties that were passed to `emit()`.

## Emitting events from actions and triggers

Actions and triggers receive `emit` as the third parameter of `execute`:

```javascript
definition.action({
  name: 'myAction',
  async execute(params, context, emit) {
    emit({
      type: 'EventName',   // must match definition.event({ name })
      id: params.id,
      data: { /* ... */ }
    })
  }
})
```

The `type` field in the emitted event object must match the `name` of a `definition.event()` in the same service.

## Complete example: create, update, delete

```javascript
// Source: live-change-stack/services/notification-service/notification.js

const Notification = definition.model({
  name: 'Notification',
  properties: {
    // ...
  }
})

definition.event({
  name: "created",
  async execute({ notification, data }) {
    await Notification.create({ ...data, id: notification })
  }
})

definition.event({
  name: "markedRead",
  async execute({ notification }) {
    await Notification.update(notification, { readState: 'read' })
  }
})

definition.event({
  name: "deleted",
  async execute({ notification }) {
    await Notification.delete(notification)
  }
})
```

Actions that emit these events:

```javascript
definition.action({
  name: 'createNotification',
  waitForEvents: true,
  async execute({ message }, { client }, emit) {
    const id = app.generateUid()
    emit({
      type: 'created',
      notification: id,
      data: { message, readState: 'new', sessionOrUserType: 'user_User', sessionOrUser: client.user }
    })
    return id
  }
})

definition.action({
  name: 'markRead',
  waitForEvents: true,
  async execute({ notification }, { client }, emit) {
    emit({ type: 'markedRead', notification })
  }
})
```

## Events with properties (typed)

Events can declare `properties` for validation, just like actions:

```javascript
// Source: live-change-stack/services/email-service/send.js

definition.event({
  name: "sent",
  properties: {
    message: { type: String },
    content: { type: Object },
    result: { type: Object }
  },
  async execute({ message, content, result }) {
    await SentEmail.create({ id: message, content, result })
  }
})
```

## `waitForEvents: true`

By default, when an action or trigger calls `emit()`, the events are processed asynchronously — the action returns before the event handler runs. Set `waitForEvents: true` to make the action wait until all emitted events have been processed:

```javascript
definition.action({
  name: 'createImage',
  waitForEvents: true,
  async execute({ name, width, height }, { client }, emit) {
    const id = app.generateUid()
    emit({
      type: 'ImageCreated',
      image: id,
      data: { name, width, height }
    })
    return id  // returns only after ImageCreated event is fully processed
  }
})
```

Use `waitForEvents: true` when:
- The action returns an id that must exist in the database when the caller uses it.
- Subsequent operations depend on the event having been processed.

Triggers also support `waitForEvents`:

```javascript
// Source: live-change-stack/services/secret-code-service/index.js

definition.trigger({
  name: "authenticationSecret",
  waitForEvents: true,
  async execute({ authentication }, context, emit) {
    const code = app.generateUid()
    const secretCode = crypto.randomInt(0, Math.pow(10, digits)).toFixed().padStart(digits, '0')
    const expire = new Date()
    expire.setTime(Date.now() + (config.expireTime || 10*60*1000))
    emit({
      type: 'codeCreated',
      code, authentication, secretCode, expire
    })
    return { type: 'code', code, expire, secret: { secretCode } }
  }
})
```

## Auto-generated events (relations plugin)

When a model uses relations (`userItem`, `itemOf`, `propertyOf`, etc.), the relations plugin automatically generates CRUD events and the actions/triggers that emit them. You don't need to define these events manually.

For example, a model with `itemOf` gets auto-generated events like:
- `serviceName_ModelNameCreated` — creates the record
- `serviceName_ModelNameUpdated` — updates the record
- `serviceName_ModelNameDeleted` — deletes the record

Use `describe` to see what was generated:

```bash
node server/start.js describe --service myService --output yaml
```

## Key rule: events modify only same-service models

Event handlers must only write to models defined in the **same service**. A `foreignModel` (model from another service) is read-only — it supports `.get()`, `.indexObjectGet()`, `.indexRangeGet()` but **not** `.create()`, `.update()`, `.delete()`.

To change data in another service, use `triggerService()` from the action or trigger (not from the event):

```javascript
// In an action or trigger — NOT in an event handler:
await triggerService({
  service: 'otherService',
  type: 'otherService_createSomeModel'
}, { /* properties */ })
```

## Summary

| Concept | Description |
|---|---|
| `definition.event({ name, execute })` | Defines an event handler that performs DB writes |
| `emit({ type, ... })` | Publishes an event from an action or trigger |
| `waitForEvents: true` | Makes action/trigger wait for events to complete |
| Same-service only | Events can only modify models from the same service |
| Auto-generated | Relations plugin creates CRUD events automatically |
