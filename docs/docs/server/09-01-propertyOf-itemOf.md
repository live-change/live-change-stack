---
title: propertyOf and itemOf
---

# propertyOf and itemOf

From **relations plugin** (`use: [ relationsPlugin ]`). Parent is a **single model** in the same or another service.

- **propertyOf** — One child record per parent (e.g. one Settings per Session, one Balance per owner). Adds a single identifier (e.g. billing, session) and Set/Update/Reset events and actions.
- **itemOf** — Many child records per parent (e.g. many TopUp per Billing, many Operation per Balance). Adds parent identifier and Created/Updated/Deleted events and actions, plus range views.

## propertyOf — configuration

```javascript
model.propertyOf = {
  what: ParentModel,   // the parent model (e.g. Session, Billing)
  readAccess?: AccessSpecification,
  writeAccess?: AccessSpecification,
  listAccess?: AccessSpecification,
  setAccess?: AccessSpecification,
  updateAccess?: AccessSpecification,
  setOrUpdateAccess?: AccessSpecification,
  resetAccess?: AccessSpecification,
  readAllAccess?: AccessSpecification,
  singleAccess?: AccessSpecification,
  singleAccessControl?: AccessControlSettings,
  readAccessControl?: AccessControlSettings,
  writeAccessControl?: AccessControlSettings,
  listAccessControl?: AccessControlSettings,
  setAccessControl?: AccessControlSettings,
  updateAccessControl?: AccessControlSettings,
  resetAccessControl?: AccessControlSettings,
  setOrUpdateAccessControl?: AccessControlSettings,
  views?: [{ type: 'range' | 'object', internal?: boolean, readAccess?, readAccessControl?, fields? }]
}
```

## itemOf — configuration

```javascript
model.itemOf = {
  what: ParentModel,
  readAccess?: AccessSpecification,
  writeAccess?: AccessSpecification,
  createAccess?: AccessSpecification,
  updateAccess?: AccessSpecification,
  deleteAccess?: AccessSpecification,
  copyAccess?: AccessSpecification,
  readAllAccess?: AccessSpecification,
  readAccessControl?: AccessControlSettings,
  writeAccessControl?: AccessControlSettings,
  createAccessControl?: AccessControlSettings,
  updateAccessControl?: AccessControlSettings,
  deleteAccessControl?: AccessControlSettings,
  copyAccessControl?: AccessControlSettings,
  readAllAccessControl?: AccessControlSettings
}
```

## Example: itemOf (TopUp per Billing)

```javascript
// Source: live-change-stack/services/billing-service/topUp.js

const TopUp = definition.model({
  name: "TopUp",
  itemOf: {
    what: Billing,
    readAccessControl: { roles: ['owner', 'admin'] }
  },
  properties: {
    value: { type: Number },
    price: { type: Number },
    currency: { type: String },
    state: { type: String, options: ['created', 'paid', 'failed', 'refunded'], default: 'created' }
  }
})
```

## Example: itemOf (Operation per Balance)

```javascript
// Source: live-change-stack/services/balance-service/operation.js

const Operation = definition.model({
  name: "Operation",
  itemOf: {
    what: Balance,
    readAccessControl: { roles: ['owner', 'admin'] }
  },
  properties: {
    state: { type: String, options: ['started', 'finished', 'canceled'] },
    causeType: { type: String, validation: ['nonEmpty'] },
    cause: { type: String, validation: ['nonEmpty'] },
    change: config.currencyType,
    amountBefore: config.currencyType,
    amountAfter: config.currencyType,
    updatedAt: { ... }
  }
})
```

## propertyOf in session-service

Session-service uses a **processor** that turns **sessionProperty** into **propertyOf** with `what: Session` and adds views/actions (mySessionXxx, setMySessionXxx, etc.). So “session property” is implemented as propertyOf Session.
