---
title: Choosing ownership — userItem, sessionOrUserItem, entity, domain relations
---

# Choosing ownership — userItem, sessionOrUserItem, entity, domain relations

Use this page when deciding **how to attach ownership** and **which generated views/actions** you get. Semantic detail for each relation type stays in [Relations overview](/server/09-relations.html), [propertyOf / itemOf](/server/09-01-propertyOf-itemOf.html), and [userProperty / userItem](/server/09-03-userProperty-userItem.html).

Implementation references:

- User-service processors: `live-change-stack/services/user-service/userItem.js`, `userProperty.js`, `sessionOrUserItem.js`, …
- Relations plugin inventory: [Relations plugin — generated artifacts](/server/09-00-relations-generated-artifacts.html)

## Per-user, session, or contact

| Goal | Model annotation | Notes |
|------|------------------|--------|
| Owner is **always** the logged-in **User**; user lists and edits **their** rows (todos, orders, auctions, …) | **`userItem`** (many rows per user) or **`userProperty`** (one row per user) | Requires **`use: [ userService, … ]`** on the service. **Do not** declare a manual `user` field — the processor adds **`user`** and **`byUser`**. Use **`userReadAccess`**, **`userCreateAccess`**, **`userUpdateAccess`**, **`userDeleteAccess`**, or shorthand **`userWriteAccess`** — not a generic “ownerAccessControl” name. |
| Owner is **Session or User** (anonymous/session drafts → transfer on sign-in) | **`sessionOrUserItem`** / **`sessionOrUserProperty`** | See [sessionOrUser](/server/09-04-sessionOrUserProperty-sessionOrUserItem.html). |
| Owner is **Contact or User** (email/phone → linked account) | **`contactOrUserItem`** / **`contactOrUserProperty`** | See [contactOrUser](/server/09-05-contactOrUserProperty-contactOrUserItem.html). |

There is **no** `sessionItem` annotation; session-only patterns often use **session-service** `sessionProperty` (maps to `propertyOf` Session) — see [09-01](/server/09-01-propertyOf-itemOf.html).

## When **not** to use userItem

- **Global / catalog entities** with **role-based** access and **no** natural “this row belongs to client.user” rule → prefer **`entity`** (see [Models — entity](/server/05-models.html)).
- Child rows tied to a **domain parent** (invoice lines under invoice, comments under article) → **`itemOf`** / **`propertyOf`** / **`itemOfAny`** / **`propertyOfAny`** per parent type — see [09-01](/server/09-01-propertyOf-itemOf.html) and [09-02](/server/09-02-propertyOfAny-itemOfAny.html).

## userItem — typical generated names (Auction → examples)

From `userItem.js`, for model **`Auction`**:

| Kind | Name pattern | Example |
|------|----------------|---------|
| Range (“my list”) | `myUser` + plural(model) | `myUserAuctions` |
| Single (“my row”) | `myUser` + model | `myUserAuction` |
| Sorted ranges | `myUser` + plural + `By` + Field | `myUserAuctionsByCreatedAt` if `sortBy` is set |
| Create / update / delete | `createMyUser` / `updateMyUser` / `deleteMyUser` + model | `createMyUserAuction`, … |

The relations plugin still generates **`itemOf`** CRUD names such as **`createAuction`** / **`updateAuction`** when `userItem` injects `itemOf: { what: User }`. Prefer **`createMyUserAuction`** / **`updateMyUserAuction`** for APIs that must stamp **`user`** consistently via user-service (`userItem.js`).

## Domain relations (short)

| Annotation | Use when |
|------------|-----------|
| **`propertyOf`** | One child record per parent (1:1 “state” tied to parent id). |
| **`itemOf`** | Many children per parent (list). |
| **`propertyOfAny`** / **`itemOfAny`** | Same as above but **polymorphic** parent (`ownerType` + id style fields). |

Full naming of generated views for these is in [09-00](/server/09-00-relations-generated-artifacts.html).

## Discovering the real API

Always confirm names with **`describe`** (see [Getting started](/server/01-getting-started.html) / project scripts), e.g. `fnm exec -- node server/start.js describe --service myService --output yaml`.
