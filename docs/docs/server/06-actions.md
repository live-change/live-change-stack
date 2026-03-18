---
title: Actions
---

# Actions

Actions are defined with **definition.action({ name, properties, returns, execute })**. They run in a request context, can read **client.user** / **client.session**, call **triggerService** or **trigger** to invoke other services or triggers, and **emit** events to create or update model data.

## Action that creates an entity and starts payment (topUp)

Validates input, ensures billing exists, emits a creation event, then triggers a payment flow:

```javascript
// Source: live-change-stack/services/billing-service/topUp.js (excerpt)

definition.action({
  name: "topUp",
  properties: {
    value: { type: Number },
    price: { type: Number },
    currency: { type: String }
  },
  returns: { type: Object },
  async execute({ value, price, currency, cancelUrl, successUrl }, { trigger, triggerService, client }, emit) {
    const offer = config.topUpOffers?.find(offer => (offer.currency === currency) && (offer.price === price) && (offer.value === value))
    const anyTopUpPrice = config?.anyTopUpPrices?.find(price => price.currency === currency)
    if(!offer && !anyTopUpPrice) {
      throw new Error("Invalid top up offer")
    }
    // ... validation ...

    const billing = client.user  // billing is user property
    const billingData = await Billing.get(billing)
    if(!billingData) {
      await triggerService({
        service: definition.name,
        type: 'billing_setOrUpdateBilling'
      }, { user: client.user })
    }
    const topUp = app.generateUid()
    emit({
      type: 'TopUpCreated',
      topUp, data: { value, price, currency }, identifiers: { billing }
    })
    const triggerResult = (await trigger({
      type: 'startPayment'
    }, {
      causeType: 'billing_TopUp',
      cause: topUp,
      payerType: 'user_User',
      payer: client.user,
      items: [{ name: 'Top Up ', price: price, currency: currency, quantity: 1 }],
      successUrl: config.topUpSuccessUrl + '/' + topUp.replace(/\[/g, '(').replace(/]/g, ')'),
      cancelUrl: config.topUpCancelUrl + '/' + topUp.replace(/\[/g, '(').replace(/]/g, ')'),
    }))?.[0]
    if(!triggerResult) {
      throw new Error("No payment service available")
    }
    return triggerResult
  }
})
```

## Action that delegates to triggerService (giveCard)

Uses **client.user** or **client.session** to determine giver; creates a card via triggerService if it does not exist:

```javascript
// Source: speed-dating/server/business-card-service/card.js

definition.action({
  name: 'giveCard',
  properties: {
    receiverType: { type: String, validation: ['nonEmpty'] },
    receiver: { type: String, validation: ['nonEmpty'] },
    givenInType: { type: 'type' },
    givenIn: { type: 'any' }
  },
  async execute({ receiverType, receiver, givenInType, givenIn }, { client, service, triggerService }, emit) {
    const [giverType, giver] = client.user ? ['user_User', client.user] : ['session_Session', client.session]
    const cardId = App.encodeIdentifier([receiverType, receiver, giverType, giver])
    const card = await ReceivedCard.get(cardId)
    if(card) {
      throw new Error('Card already given')
    } else {
      return await triggerService({
        service: definition.name,
        type: 'businessCard_setReceivedCard',
      }, {
        sessionOrUserType: receiverType,
        sessionOrUser: receiver,
        giverType,
        giver,
        givenInType,
        givenIn
      })
    }
  }
})
```

## Event-sourcing: how actions change data

LiveChange uses an event-sourcing pattern. Actions do **not** call `Model.create()` / `Model.update()` / `Model.delete()` directly. Instead, they change data in one of two ways:

1. **`emit()`** — publish an event that will be handled by a `definition.event()` handler (see [Events](./06b-events.md)). The event handler performs the actual database write.
2. **`triggerService()`** — invoke a relation-declared trigger on the same or another service. The trigger's internal event handler performs the write.

This separation ensures that all state changes are recorded as events and can be replayed.

### Flow diagram

```
Action  ──emit()──▶  Event handler  ──▶  Model.create/update/delete
   │
   └──triggerService()──▶  Other service's trigger  ──emit()──▶  ...
```

### Example: action emits an event

```javascript
// Source: live-change-stack/services/notification-service/notification.js

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
    return id
  }
})

// The event handler that performs the actual write:
definition.event({
  name: 'created',
  async execute({ notification, data }) {
    await Notification.create({ ...data, id: notification })
  }
})
```

### Example: action uses triggerService for relation-declared CRUD

When a model has relations (`userItem`, `itemOf`, `propertyOf`, etc.), the relations plugin auto-generates CRUD triggers. Use `triggerService()` to call them:

```javascript
// Source: speed-dating/server/business-card-service/card.js

await triggerService({
  service: definition.name,
  type: 'businessCard_setReceivedCard',
}, {
  sessionOrUserType: receiverType,
  sessionOrUser: receiver,
  // ... other fields
})
```

### `waitForEvents: true`

By default, `emit()` is asynchronous — the action returns before events are processed. Set `waitForEvents: true` when you need events to be fully processed before the action returns its result:

```javascript
definition.action({
  name: 'createImage',
  waitForEvents: true,  // wait for ImageCreated event to complete
  async execute({ name, width, height }, { client }, emit) {
    const id = app.generateUid()
    emit({ type: 'ImageCreated', image: id, data: { name, width, height } })
    return id
  }
})
```

### Cross-service writes

Actions cannot write to models from other services directly (`foreignModel` is read-only). Use `triggerService()` to invoke the target service's triggers:

```javascript
await triggerService({
  service: 'balance',
  type: 'balance_setOrUpdateBalance',
}, { ownerType: 'billing_Billing', owner: object })
```

## Context and helpers

- **execute(params, context, emit)** — params come from the client; context includes **client** (user, session), **triggerService**, **trigger**, **service**.
- **client.user** — Set when the session is bound to a user.
- **client.session** — Current session id.
- **triggerService({ service, type }, payload)** — Invokes an action/command on another (or same) service.
- **trigger({ type }, payload)** — Fires a trigger (e.g. startPayment) that may be handled by another service.
- **emit(event)** — Appends an event to the event log; event handlers update model state. See [Events](./06b-events.md).
- **app.generateUid()** — Generates a unique id for new entities.
