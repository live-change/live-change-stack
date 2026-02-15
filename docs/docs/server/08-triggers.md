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

## Naming and routing

Trigger **names** typically follow the pattern **eventName_serviceName_ModelName** (e.g. `chargeCollected_billing_TopUp`). The framework routes events from other services to triggers whose name matches. **triggerService** calls an action/command on a service; **trigger** invokes a trigger by type (e.g. balance_doOperation) that may be implemented by another service.
