---
title: sessionOrUserProperty and sessionOrUserItem
---

# sessionOrUserProperty and sessionOrUserItem

From **user service** (`use: [ userService ]`). The owner is either a **Session** or a **User**. Useful for data created before login (session) that can later be transferred to the user on sign-in. A processor turns **sessionOrUserProperty** / **sessionOrUserItem** into **propertyOfAny** / **itemOfAny** with **to: ['sessionOrUser', ...extendedWith]** and **sessionOrUserTypes: ['session_Session', 'user_User']**, then adds views and actions and a **signedIn** trigger to transfer or merge session data to the user.

## sessionOrUserProperty

One record per session-or-user (and optionally per extra dimensions from **extendedWith**). The processor adds:

- **my&lt;ModelName&gt;** — Single property for current client (session or user), optionally with extra params for extendedWith.
- **my&lt;Xxx&gt;&lt;ModelName&gt;s** — Range views when **extendedWith** is used (e.g. myGiverReceivedCards).
- Actions **setMy&lt;ModelName&gt;** (Set), **updateMy&lt;ModelName&gt;** (Update), **setOrUpdateMy&lt;ModelName&gt;** (Set or update), **resetMy&lt;ModelName&gt;** (Reset).

On **signedIn**, session properties can be **transferred** to the user or **merged** (if **merge** and optionally **mergeWithoutDelete** are set).

### Configuration

```javascript
model.sessionOrUserProperty = {
  extendedWith?: string | string[],   // e.g. ['giver'] → sessionOrUserType, sessionOrUser, giverType, giver
  ownerReadAccess?: (params, context) => boolean,
  ownerSetAccess?: AccessSpecification,
  ownerUpdateAccess?: AccessSpecification,
  ownerResetAccess?: AccessSpecification,
  ownerWriteAccess?: AccessSpecification,
  writeableProperties?: string[],
  merge?: (sessionProperty, userProperty) => mergedData | null,  // on sign-in
  mergeWithoutDelete?: boolean,
  ownerViews?: [{ name?, access?, fields? }]
}
```

## sessionOrUserItem

Many records per session-or-user. The processor adds:

- **my&lt;ModelName&gt;s** (plural) — Range of items for current session/user.
- **mySessionOrUser&lt;ModelName&gt;sBy&lt;SortField&gt;** when **sortBy** is set.
- **my&lt;ModelName&gt;** — Single item by id (ownership check).
- Actions **createMy&lt;ModelName&gt;** (Create), **updateMy&lt;ModelName&gt;** (Update), **deleteMyUser&lt;ModelName&gt;** (Delete).

On **signedIn**, session items can be **transferred** to the user or **merged** (if **merge** returns { transferred, updated, deleted }).

### Configuration

```javascript
model.sessionOrUserItem = {
  extendedWith?: string | string[],
  ownerReadAccess?: (params, context) => boolean,
  ownerCreateAccess?: AccessSpecification,
  ownerUpdateAccess?: AccessSpecification,
  ownerWriteAccess?: AccessSpecification,
  userDeleteAccess?: AccessSpecification,
  writableProperties?: string[],
  sortBy?: string[],
  merge?: (sessionItems, userItems) => { transferred?, updated?, deleted? }
}
```

## Example: ReceivedCard (sessionOrUserProperty with extendedWith)

```javascript
// Source: speed-dating/server/business-card-service/card.js

const ReceivedCard = definition.model({
  name: "ReceivedCard",
  sessionOrUserProperty: {
    extendedWith: ['giver'],
    ownerReadAccess: () => true,
    ownerUpdateAccess: () => true,
    ownerResetAccess: () => true,
    singleAccess: () => true
  },
  properties: {
    state: { type: String, default: 'received', validation: ['nonEmpty'], options: ['received', 'accepted', 'rejected', 'blocked'] },
    givenAt: { type: Date, default: () => new Date() },
    stateUpdatedAt: { type: Date, updated: () => new Date() },
    givenInType: { type: 'type' },
    givenIn: { type: 'any' }
  },
  indexes: {
    byOwnerAndStateAndTime: { property: ['sessionOrUserType', 'sessionOrUser', 'state', 'givenAt'] }
  }
})
```

Here the “owner” is session-or-user plus **giver** (giverType, giver), so you can list “my received cards” or “my received cards by giver”.
