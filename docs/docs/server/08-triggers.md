---
title: Triggers
---

# Triggers

Triggers are defined with **definition.trigger({ name, properties, execute })**. They run when matching events occur (either in the same service or from another service). They are used to keep cross-service state in sync (e.g. create a balance when Billing is created, or update TopUp state when payment completes).

## Trigger on model creation (createBilling_Billing)

When a Billing entity is created, ensure a balance exists for that owner:

```javascript
// Source: live-change-stack/services/billing-service/billing.js

definition.trigger({
  name: 'createBilling_Billing',
  properties: {
    object: { type: Billing }
  },
  async execute({ object }, { triggerService }, emit) {
    const ownerInfo = { ownerType: 'billing_Billing', owner: object }
    const existingBalance = await app.serviceViewGet('balance', 'balance', ownerInfo)
    if(!existingBalance) {
      await triggerService({
        service: 'balance',
        type: 'balance_setOrUpdateBalance',
      }, ownerInfo)
    }
  }
})
```

## Trigger on external payment event (chargeCollected_billing_TopUp)

When a payment service emits that a charge was collected for a billing TopUp, credit the balance and update TopUp state:

```javascript
// Source: live-change-stack/services/billing-service/topUp.js

definition.trigger({
  name: 'chargeCollected_billing_TopUp',
  properties: {
    paymentType: { type: String },
    payment: { type: String },
    causeType: { type: String },
    cause: { type: String },
    payerType: { type: String },
    payer: { type: String },
    items: { type: String }
  },
  async execute(props, { client, triggerService, trigger }, emit) {
    const { paymentType, payment, causeType, cause, payerType, payer, items } = props
    const topUp = await TopUp.get(cause)
    if(!topUp) throw new Error("TopUp not found")
    if(topUp.state !== 'created') throw new Error("TopUp already processed")
    const balance = App.encodeIdentifier(['billing_Billing', topUp.billing])
    await trigger({
      type: 'balance_doOperation'
    }, {
      balance,
      causeType: 'billing_TopUp',
      cause: topUp.id,
      change: topUp.value
    })
    await triggerService({
      service: definition.name,
      type: 'billing_updateTopUp'
    }, {
      billing: topUp.billing,
      topUp: topUp.id,
      state: 'paid'
    })
  }
})
```

## Trigger on refund and payment failure

Same event shape, different handling: refund decrements balance and sets state to 'refunded'; payment failed only updates state to 'failed':

```javascript
// Source: live-change-stack/services/billing-service/topUp.js (excerpts)

definition.trigger({
  name: 'chargeRefunded_billing_TopUp',
  properties: { paymentType, payment, causeType, cause, payerType, payer, items },
  async execute(props, { client, triggerService, trigger }, emit) {
    const { causeType, cause } = props
    const topUp = await TopUp.get(cause)
    if(!topUp || topUp.state !== 'paid') throw new Error("Impossible to refund not paid top up")
    const balance = App.encodeIdentifier(['billing_Billing', topUp.billing])
    await trigger({ type: 'balance_doOperation' }, {
      billing: topUp.billing,
      causeType: 'billing_TopUp',
      cause: topUp.id,
      change: -topUp.value,
      force: true,
    })
    await triggerService({
      service: definition.name,
      type: 'billing_updateTopUp'
    }, { topUp: topUp.id, state: 'refunded' })
  }
})

definition.trigger({
  name: 'paymentFailed_billing_TopUp',
  properties: { ... },
  async execute(props, { client, triggerService }, emit) {
    const topUp = await TopUp.get(props.cause)
    if(!topUp || topUp.state !== 'created') return
    await triggerService({
      service: definition.name,
      type: 'billing_updateTopUp'
    }, { billing: topUp.billing, topUp: topUp.id, state: 'failed' })
  }
})
```

## Change triggers (automatic, from relations plugin)

When a model uses relations (`propertyOf`, `itemOf`, `userItem`, `propertyOfAny`, etc.), the relations plugin **automatically fires change triggers** every time a record is created, updated, or deleted. You don't need to emit anything — the framework does it.

### Trigger names fired automatically

For a model `Schedule` in service `cron`, the following triggers are fired on every change:

| Trigger name | When fired |
|---|---|
| `createCron_Schedule` | On create |
| `updateCron_Schedule` | On update |
| `deleteCron_Schedule` | On delete |
| `changeCron_Schedule` | On any change (create, update, or delete) |
| `createObject` | On create (generic, all models) |
| `updateObject` | On update (generic, all models) |
| `deleteObject` | On delete (generic, all models) |
| `changeObject` | On any change (generic, all models) |

The naming pattern is: `{changeType}{ServiceName}_{ModelName}` where `changeType` is `create`, `update`, `delete`, or `change`, and the service name is capitalized (e.g. `cron` → `Cron`).

### Parameters passed to change triggers

All change triggers receive the same parameters:

```javascript
{
  objectType,   // e.g. 'cron_Schedule'
  object,       // record ID
  identifiers,  // parent identifiers extracted from the model
  data,         // new data (null on delete)
  oldData,      // old data (null on create)
  changeType    // 'create', 'update', or 'delete'
}
```

### Listening to change triggers

Define a trigger with the matching name in any service:

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
      // Schedule was updated or deleted — cancel old timer
      await triggerService({
        service: 'timer',
        type: 'cancelTimerIfExists',
      }, {
        timer: 'cron_Schedule_' + object
      })
    }
    if(data) {
      // Schedule was created or updated — set up new timer
      await processSchedule({ id: object, ...data }, { triggerService })
    }
  }
})
```

### Use the `change*` variant for most cases

The `change*` trigger fires on create, update, and delete. Check `data` and `oldData` to distinguish:

| `oldData` | `data` | Meaning |
|---|---|---|
| `null` | `{...}` | Created |
| `{...}` | `{...}` | Updated |
| `{...}` | `null` | Deleted |

This is the recommended approach — a single trigger handles all lifecycle events.

### Cross-service change triggers

Change triggers work across services. A trigger in service A can react to model changes in service B:

```javascript
// In service 'billing': react to Billing model creation
definition.trigger({
  name: 'createBilling_Billing',
  properties: {
    object: { type: Billing }
  },
  async execute({ object }, { triggerService }, emit) {
    // Ensure a balance exists when billing is created
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

### Common patterns

1. **Sync state on change** — use `changeSvc_Model` to keep derived data up to date (e.g. cron-service cancels/recreates timers when a Schedule changes).
2. **Initialize on create** — use `createSvc_Model` to set up related resources (e.g. create a balance when billing is created).
3. **Cascade delete** — the relations plugin handles this automatically for parent-child relations, but you can listen to `deleteSvc_Model` for custom cleanup.
4. **User deletion** — `deleteUser_User` and `deleteObject` are fired explicitly by user-service when a user deletes their account.

## Event-sourcing: how triggers change data

Like actions, triggers follow the event-sourcing pattern — they should **not** call `Model.create()` / `Model.update()` / `Model.delete()` directly. Instead:

- **`triggerService()`** — invoke a relation-declared trigger on the same or another service.
- **`emit()`** — publish an event handled by a `definition.event()` in the same service. Use `waitForEvents: true` if the trigger needs to wait for event processing.

Cross-service writes always go through `triggerService()` — `foreignModel` is read-only.

```javascript
// Source: live-change-stack/services/billing-service/topUp.js

definition.trigger({
  name: 'chargeCollected_billing_TopUp',
  async execute(props, { triggerService }, emit) {
    // Cross-service write via triggerService
    await trigger({ type: 'balance_doOperation' }, {
      balance, causeType: 'billing_TopUp', cause: topUp.id, change: topUp.value
    })
    // Same-service write via relation-declared trigger
    await triggerService({
      service: definition.name,
      type: 'billing_updateTopUp'
    }, { topUp: topUp.id, state: 'paid' })
  }
})
```

See [Events](./06b-events.md) for details on `definition.event()` and `emit()`.

## Naming and routing

Trigger **names** typically follow the pattern **eventName_serviceName_ModelName** (e.g. `chargeCollected_billing_TopUp`). The framework routes events from other services to triggers whose name matches. **triggerService** calls an action/command on a service; **trigger** invokes a trigger by type (e.g. balance_doOperation) that may be implemented by another service.
