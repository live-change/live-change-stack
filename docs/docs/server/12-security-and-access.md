---
title: Security and access
---

# Security and access

Access control is enforced at multiple layers: **view/action accessControl**, **model/userProperty/sessionOrUserProperty/entity** roles, **relations plugin** (readAccessControl, writeAccessControl on propertyOf/itemOf), and **security.config** for rate-limiting and bans (e.g. wrong secret code).

## View accessControl (roles and objects)

Restrict who can call a view (or action) by roles and/or by object-level access (accessControl service):

```javascript
// Source: live-change-stack/services/billing-service/topUp.js

definition.view({
  name: "topUp",
  properties: { topUp: { type: TopUp } },
  returns: { type: TopUp },
  accessControl: {
    roles: ['owner'],
    objects: (props) => [{
      objectType: definition.name + '_TopUp',
      object: props.topUp
    }]
  },
  async daoPath({ topUp }, { client, service }, method) {
    return TopUp.path(topUp)
  }
})
```

So only users with role **owner** for the given TopUp object can read it.

## Model access (userProperty, entity)

- **userProperty** — One record per user; **userReadAccess** / **readAccessControl** (roles like 'owner', 'admin') control who can read.
- **entity** — Global entity with **writeAccessControl** / **readAccessControl** (roles):

```javascript
// Source: live-change-stack/services/billing-service/billing.js

userProperty: {
  userReadAccess: () => true,
  readAccessControl: { roles: ['owner', 'admin'] }
}
```

```javascript
// Source: speed-dating/server/speed-dating-service/event.js

entity: {
  writeAccessControl: { roles: adminRoles },
  readAccessControl: { roles: [] }
}
```

## Relation access (itemOf, propertyOf)

Relations plugin uses **readAccessControl** / **writeAccessControl** on the relation config so that access to items/properties follows the parent or role:

```javascript
// Source: live-change-stack/services/billing-service/topUp.js

itemOf: {
  what: Billing,
  readAccessControl: { roles: ['owner', 'admin'] }
}
```

## security.config (rate limits and bans)

Apps often use a **security.config.js** that defines **clientKeys**, **patterns**, and **counters** for the security/pattern service (e.g. @live-change/pattern). Counters can trigger bans (e.g. captcha or block) after N failed attempts per key (e.g. IP) in a time window:

```javascript
// Source: speed-dating/server/security.config.js

import lcp from "@live-change/pattern"

const clientKeys = (client) => [
  { key: 'user', value: client.user },
  { key: 'session', value: client.session },
  { key: 'ip', value: client.ip }
]

const counters = [
  {
    id: 'wrong-codes-captcha',
    match: ['wrong-secret-code'],
    keys: ['ip'],
    max: 2,
    duration: '1m',
    actions: [
      { type: 'ban', keys: ['ip'], ban: { type: 'captcha', actions: ['checkSecretCode'], expire: "30m" } }
    ]
  },
  {
    id: 'wrong-codes-ban',
    visible: true,
    match: ['wrong-secret-code'],
    keys: ['ip'],
    max: 5,
    duration: '10m',
    actions: [
      { type: 'ban', keys: ['ip'], ban: { type: 'block', actions: ['checkSecretCode'], expire: "2m" } }
    ]
  }
]

export default {
  clientKeys,
  patterns,
  counters
}
```

This is passed into app.config as **security: { ...securityConfig }** so the security service can enforce limits and bans on actions (e.g. checkSecretCode).
