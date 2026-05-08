---
title: userProperty and userItem
---

# userProperty and userItem

For choosing **`userItem`** vs **`entity`** vs domain **`itemOf`/`propertyOf`**, see [Owner selection & userItem](/server/09-07-owner-selection-useritem.html).

From **user service** (`use: [ userService ]`). A **processor** in user-service scans your models for **userProperty** or **userItem** and turns them into **propertyOf User** or **itemOf User**, then adds views and actions (myUserXxx, setMyUserXxx, createMyUserXxx, etc.). Use when the owner is always a **User** (logged-in).

The processor also fills **`model.ownerCrud`** (read / create / update / …) alongside any existing **`model.crud`**. Use **`editorData({ crudSource: 'ownerCrud', … })`** in the frontend for “my record” screens; see [frontend-auto-form — `editorData`](/frontend/09-api-frontend-auto-form.html#editordataoptions).

## Auto-added fields

Both `userProperty` and `userItem` are internally converted to `propertyOf: { what: User }` and `itemOf: { what: User }` respectively. This means they automatically add:

- **`user`** field (type: User, validation: `['nonEmpty']`)
- **`byUser`** index

**Do not re-declare `user` in your `properties`** — it is already added by the relation.

## userProperty

One record per user. The processor sets `model.propertyOf = { what: User, ...config }` and adds:

- View **myUser&lt;ModelName&gt;** — Read the property for `client.user`.
- Actions **setMyUser&lt;ModelName&gt;** (Set), **updateMyUser&lt;ModelName&gt;** (Update), **resetMyUser&lt;ModelName&gt;** (Reset) when the corresponding access is set.

### Configuration (on the model)

```javascript
model.userProperty = {
  userReadAccess?: (params, context) => boolean,
  userSetAccess?: AccessSpecification,
  userUpdateAccess?: AccessSpecification,
  userResetAccess?: AccessSpecification,
  userWriteAccess?: AccessSpecification,  // enables set/update/reset if not specified
  writableProperties?: string[],
  userViews?: [{ name?, prefix?, suffix?, access?, fields? }]
}
```

Access can be a function or roles; the generated view uses **userReadAccess** and the generated actions use the set/update/reset access.

## userItem

Many records per user. The processor sets `model.itemOf = { what: User, ...config }` and adds:

- View **myUser&lt;ModelName&gt;s** (plural) — Range of items for `client.user`.
- Views **myUser&lt;ModelName&gt;sBy&lt;SortField&gt;** if **sortBy** is set.
- View **myUser&lt;ModelName&gt;** — Single item by id (with ownership check).
- Actions **createMyUser&lt;ModelName&gt;** (Create), **updateMyUser&lt;ModelName&gt;** (Update), **deleteMyUser&lt;ModelName&gt;** (Delete) when the corresponding access is set.

### Configuration (on the model)

```javascript
model.userItem = {
  userReadAccess?: (params, context) => boolean,
  userCreateAccess?: AccessSpecification,
  userUpdateAccess?: AccessSpecification,
  userDeleteAccess?: AccessSpecification,
  userWriteAccess?: AccessSpecification,
  writableProperties?: string[],
  sortBy?: string[]   // e.g. ['createdAt'] → myUserThingsByCreatedAt
}
```

## When to use

- **userProperty** — Single settings/preferences object per user (e.g. Billing as user property in billing-service is a different pattern: there it’s “userProperty” in the sense of “one Billing per user” from the app’s perspective; the actual Billing model may be defined with userProperty in a service that uses user-service).
- **userItem** — List of things owned by the user (todos, orders, etc.).

For “owner can be either session or user” (e.g. before login), use [sessionOrUserProperty / sessionOrUserItem](/server/09-04-sessionOrUserProperty-sessionOrUserItem.html) instead.
