---
name: live-change-backend-change-triggers
description: React to model changes with automatic change triggers from the relations plugin
---

# Skill: live-change-backend-change-triggers (Claude Code)

Use this skill when you need to **react to model changes** — run logic when a record is created, updated, or deleted.

## When to use

- You need to keep derived data in sync when a model changes (e.g. create/cancel a timer when a schedule is created/updated/deleted).
- You want to initialize related resources when a model is created.
- You need cross-service reactions to model lifecycle events.
- You want custom cleanup logic on delete.

## How it works

The relations plugin automatically fires change triggers for every model that uses relations (`propertyOf`, `itemOf`, `userItem`, `propertyOfAny`, etc.). You just define a trigger with the matching name.

## Step 1 – Understand the naming convention

For a model `MyModel` in service `myService`, these triggers are fired automatically:

| Trigger name | When |
|---|---|
| `createMyService_MyModel` | On create |
| `updateMyService_MyModel` | On update |
| `deleteMyService_MyModel` | On delete |
| `changeMyService_MyModel` | On any change |
| `createObject` / `updateObject` / `deleteObject` / `changeObject` | Generic (all models) |

The pattern is: `{changeType}{ServiceName}_{ModelName}` where service name is capitalized.

## Step 2 – Define a change trigger (recommended: use `change*`)

The `change*` variant covers all cases. Check `data` and `oldData` to distinguish create/update/delete:

```javascript
definition.trigger({
  name: 'changeMyService_MyModel',
  properties: {
    object: {
      type: MyModel,
      validation: ['nonEmpty'],
    },
    data: {
      type: Object,
    },
    oldData: {
      type: Object,
    }
  },
  async execute({ object, data, oldData }, { service, trigger, triggerService }, emit) {
    if(oldData) {
      // Updated or deleted — clean up old state
    }
    if(data) {
      // Created or updated — set up new state
    }
  }
})
```

How to distinguish:

| `oldData` | `data` | Meaning |
|---|---|---|
| `null` | `{...}` | Created |
| `{...}` | `{...}` | Updated |
| `{...}` | `null` | Deleted |

## Step 3 – Real example: cron-service reacting to Schedule changes

The cron-service uses `changeCron_Schedule` to automatically manage timers when schedules are created, updated, or deleted:

```javascript
// Source: live-change-stack/services/cron-service/schedule.js

definition.trigger({
  name: 'changeCron_Schedule',
  properties: {
    object: {
      type: Schedule,
      validation: ['nonEmpty'],
    },
    data: {
      type: Object,
    },
    oldData: {
      type: Object,
    }
  },
  execute: async ({ object, data, oldData }, { service, trigger, triggerService }, emit) => {
    if(oldData) {
      // Cancel old timer on update or delete
      await triggerService({
        service: 'timer',
        type: 'cancelTimerIfExists',
      }, {
        timer: 'cron_Schedule_' + object
      })
      await ScheduleInfo.delete(object)
    }
    if(data) {
      // Create new timer on create or update
      await processSchedule({ id: object, ...data }, { triggerService })
    }
  }
})
```

This means: when a user creates a Schedule via the UI or API, the timer is automatically set up. When they update it, the old timer is canceled and a new one created. When they delete it, the timer is canceled.

## Step 4 – Specific lifecycle triggers (alternative)

If you only care about one lifecycle event, use the specific variant:

```javascript
// React only to creation
definition.trigger({
  name: 'createBilling_Billing',
  properties: {
    object: { type: Billing }
  },
  async execute({ object }, { triggerService }, emit) {
    // Initialize balance when billing is created
    const existingBalance = await app.serviceViewGet('balance', 'balance', {
      ownerType: 'billing_Billing', owner: object
    })
    if(!existingBalance) {
      await triggerService({
        service: 'balance',
        type: 'balance_setOrUpdateBalance',
      }, { ownerType: 'billing_Billing', owner: object })
    }
  }
})
```

## Step 5 – Full trigger parameters

All change triggers receive:

```javascript
{
  objectType,   // e.g. 'cron_Schedule' (service_Model)
  object,       // record ID
  identifiers,  // parent identifiers from the model's relations
  data,         // new data (null on delete)
  oldData,      // old data (null on create)
  changeType    // 'create', 'update', or 'delete'
}
```

The `identifiers` object contains the parent references defined in the model's relations (e.g. for `itemOf: { what: Device }`, identifiers would include `{ device: '...' }`).

## Step 6 – Cross-service triggers

Change triggers work across services. Define the trigger in any service — the framework routes it by name:

```javascript
// In serviceA, react to changes in serviceB's Model
const SomeModel = definition.foreignModel('serviceB', 'SomeModel')

definition.trigger({
  name: 'changeServiceB_SomeModel',
  properties: {
    object: { type: SomeModel },
    data: { type: Object },
    oldData: { type: Object }
  },
  async execute({ object, data, oldData }, { triggerService }) {
    // React to changes in SomeModel from serviceB
  }
})
```

## Common patterns

| Pattern | Trigger to use | Example |
|---|---|---|
| Keep derived data in sync | `changeSvc_Model` | Cron: cancel/create timers on schedule change |
| Initialize on creation | `createSvc_Model` | Billing: create balance when billing created |
| Custom cleanup on delete | `deleteSvc_Model` | Custom: archive or notify before deletion |
| React to any model change | `changeObject` | Audit: log all changes across all models |
