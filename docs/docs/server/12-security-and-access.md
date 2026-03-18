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

## Granting permissions programmatically

The sections above describe *declarative* access control — who can read/write based on roles. But roles must be **granted** to users at runtime. The `access-control-service` provides two triggers for this, auto-generated from its model relations:

### `accessControl_setAccess` — per-user/session roles

Grants specific roles to a specific user or session on an object:

```javascript
await triggerService({ service: 'accessControl', type: 'accessControl_setAccess' }, {
  objectType: 'serviceName_ModelName',  // e.g. 'company_Company'
  object: objectId,                      // the object's id
  roles: ['owner'],                      // array of role strings
  sessionOrUserType: 'user_User',        // or 'session_Session'
  sessionOrUser: client.user,            // user id or session id
  lastUpdate: new Date()
})
```

Parameters:

| Parameter | Description |
|---|---|
| `objectType` | Format: `serviceName_ModelName` (e.g. `company_Company`, `uploadedFiles_File`) |
| `object` | The id of the object to grant access to |
| `roles` | Array of role strings (e.g. `['owner']`, `['reader', 'writer']`) |
| `sessionOrUserType` | `'user_User'` for a logged-in user, `'session_Session'` for an anonymous session |
| `sessionOrUser` | The user id (`client.user`) or session id (`client.session`) |
| `lastUpdate` | Timestamp, typically `new Date()` |

### `accessControl_setPublicAccess` — roles for everyone

Grants roles to all users and/or all sessions on an object (no specific user required):

```javascript
await triggerService({ service: 'accessControl', type: 'accessControl_setPublicAccess' }, {
  objectType: 'serviceName_ModelName',
  object: objectId,
  userRoles: ['reader'],        // roles granted to all logged-in users
  sessionRoles: ['reader'],     // roles granted to all sessions (including anonymous)
  availableRoles: ['reader'],   // roles available via requestAccess action
  lastUpdate: new Date()
})
```

Parameters:

| Parameter | Description |
|---|---|
| `userRoles` | Roles automatically given to every logged-in user |
| `sessionRoles` | Roles automatically given to every session (including anonymous) |
| `availableRoles` | Roles that users can request via the `requestAccess` action |
| `autoGrantRequests` | Optional number — auto-accept this many access requests (decrements on each grant) |

### How roles are resolved

When checking access, the system collects roles from multiple sources and merges them:

1. **PublicAccess** — `sessionRoles` for all sessions, `userRoles` for logged-in users
2. **Access** — per-session and per-user roles on the specific object
3. **Parent roles** — roles inherited from parent objects (via `accessControlParents`)
4. **Global roles** — `client.roles` (e.g. `['admin']` set at the application level)
5. **Special** — `user_User` object where `object === client.user` automatically gets the `'owner'` role

The collected roles are then checked against the `roles` array in `accessControl` config (on views/actions/relations).

## Granting owner on object creation

When you define a model with `entity` and `writeAccessControl` / `readAccessControl`, the auto-generated CRUD actions check roles but do **not** automatically grant them. The creator must be explicitly given roles — otherwise they can't even read their own object after creating it.

### Recommended: change trigger

Use a change trigger that fires on creation (when `data` exists but `oldData` does not):

```javascript
// Source: auto-firma/app/server/company/company.js

const Company = definition.model({
  name: 'Company',
  entity: {
    writeAccessControl: ['owner', 'admin'],
    readAccessControl: ['owner', 'admin']
  },
  properties: { /* ... */ }
})

definition.trigger({
  name: 'changeCompany_Company',
  properties: {
    object: { type: Company, validation: ['nonEmpty'] },
    data: { type: Object },
    oldData: { type: Object }
  },
  async execute({ object, data, oldData }, { client, triggerService }) {
    if (!data || oldData) return   // only on create
    if (!client?.user) return      // only for logged-in users

    await triggerService({ service: 'accessControl', type: 'accessControl_setAccess' }, {
      objectType: 'company_Company',
      object,
      roles: ['owner'],
      sessionOrUserType: 'user_User',
      sessionOrUser: client.user,
      lastUpdate: new Date()
    })
  }
})
```

The change trigger approach is preferred because it works regardless of whether the object is created via the auto-generated action or via a custom trigger.

### Combined: public access + owner

When an object should be readable by everyone but only editable by the owner:

```javascript
// Source: golem/services/gpt-realtime-service/character.js

definition.trigger({
  name: 'createGptRealtime_Character',
  properties: {
    object: { type: Character, validation: ['nonEmpty'] }
  },
  async execute({ object }, { client, triggerService }) {
    await Promise.all([
      triggerService({ service: 'accessControl', type: 'accessControl_setPublicAccess' }, {
        objectType: 'gptRealtime_Character',
        object,
        userRoles: ['converser'],
        sessionRoles: ['converser'],
        lastUpdate: new Date()
      }),
      client.user && triggerService({ service: 'accessControl', type: 'accessControl_setAccess' }, {
        objectType: 'gptRealtime_Character',
        object,
        sessionOrUserType: 'user_User',
        sessionOrUser: client.user,
        roles: ['owner'],
        lastUpdate: new Date()
      })
    ])
  }
})
```

### Alternative: inline in a custom action

When you write a custom action (not using auto-generated CRUD), you can grant access directly inside the action:

```javascript
// Source: family-tree/server/uploaded-files-service/file.js

definition.action({
  name: "createFile",
  // ...
  async execute({ file, upload }, { client, service, trigger, triggerService }, emit) {
    // ... create the file ...

    const [sessionOrUserType, sessionOrUser] =
      client.user ? ['user_User', client.user] : ['session_Session', client.session]

    await Promise.all([
      triggerService({ service: 'accessControl', type: 'accessControl_setPublicAccess' }, {
        objectType: 'uploadedFiles_File',
        object: file,
        userRoles: fileReaderRoles,
        sessionRoles: fileReaderRoles,
        availableRoles: fileReaderRoles,
        lastUpdate: new Date()
      }),
      triggerService({ service: 'accessControl', type: 'accessControl_setAccess' }, {
        objectType: 'uploadedFiles_File',
        object: file,
        roles: fileWriterRoles,
        sessionOrUserType, sessionOrUser,
        lastUpdate: new Date()
      })
    ])

    return file
  }
})
```

Note the `sessionOrUserType`/`sessionOrUser` pattern: use `client.user` when available (logged-in), fall back to `client.session` for anonymous users.

## Access requests and invitations

The access-control-service also provides a request/invitation flow:

- **`requestAccess` action** — a user requests roles on an object. The requested roles must be listed in `availableRoles` on the object's `PublicAccess`. If `autoGrantRequests` is set, the request is automatically accepted (and the counter decrements).
- **`acceptAccessRequest` action** — an admin/owner accepts a pending access request.
- **Invitation system** — configured via `config.contactTypes` (e.g. `['email']`). Generates `inviteEmail`, `inviteManyEmails`, `acceptInvitation` actions. Invitations can create accounts for new users.

## Checking access from the frontend

Use the `myAccessTo` view to check the current user's roles on an object:

```javascript
const [access] = await Promise.all([
  live(path().accessControl.myAccessTo({
    objectType: 'company_Company',
    object: companyId
  }))
])

// access.value?.roles — array of roles, e.g. ['owner']
```

Use this to conditionally show UI elements based on the user's roles:

```vue
<Button v-if="access.value?.roles?.includes('owner')" label="Edit" />
```
