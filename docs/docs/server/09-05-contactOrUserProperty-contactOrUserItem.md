---
title: contactOrUserProperty and contactOrUserItem
---

# contactOrUserProperty and contactOrUserItem

From **user service** (`use: [ userService ]`). The owner is either a **Contact** (e.g. email, phone) or a **User**. Used when the same logical “owner” can be a not-yet-linked contact (e.g. email address) or a user after the contact is connected. A processor turns these into **propertyOfAny** / **itemOfAny** with **to: ['contactOrUser', ...extendedWith]** and **contactOrUserTypes** built from `definition.config.contactTypes` (e.g. `['user_User', 'email_Email', 'phone_Phone']`). On **contactConnected**, contact data can be transferred or merged to the user.

## contactOrUserProperty

One record per contact-or-user (and optionally **extendedWith**). Same idea as sessionOrUserProperty but owner types include contact types (email_Email, phone_Phone, etc.). The processor adds views and actions (set/update/reset/setOrUpdate) and handles **contactConnected** to move or merge contact property to the user.

### Configuration

```javascript
model.contactOrUserProperty = {
  extendedWith?: string | string[],
  ownerReadAccess?: ...,
  ownerSetAccess?: ...,
  ownerUpdateAccess?: ...,
  ownerResetAccess?: ...,
  ownerWriteAccess?: ...,
  writeableProperties?: string[],
  merge?: (contactProperty, userProperty) => mergedData | null
}
```

**contactOrUserTypes** are derived from app config: `contactTypes` (e.g. `['email', 'phone']`) become types like `email_Email`, `phone_Phone`, plus `user_User`.

## contactOrUserItem

Many records per contact-or-user. Same as sessionOrUserItem but with contact types as possible owners. The processor adds range/single views and create/update/delete actions, and **contactConnected** can transfer or merge items (merge returns { transferred, updated, deleted }).

### Configuration

```javascript
model.contactOrUserItem = {
  extendedWith?: string | string[],
  ownerReadAccess?: ...,
  ownerCreateAccess?: ...,
  ownerUpdateAccess?: ...,
  ownerWriteAccess?: ...,
  writableProperties?: string[],
  sortBy?: string[],
  merge?: (contactItems, userItems) => { transferred?, updated?, deleted? }
}
```

## When to use

Use when the same entity can be owned by a **contact** (e.g. email or phone before account exists) or by a **User** after the contact is connected. Requires **contactTypes** in app.config for the user service (e.g. `['email', 'phone']`).
