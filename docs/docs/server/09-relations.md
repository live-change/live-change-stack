---
title: Relations
---

# Relations

Relations attach models to an “owner” or parent so that each record belongs to a user, session, another model, or a polymorphic target. They add identifiers (e.g. user, billing, sessionOrUserType/sessionOrUser), indexes, events, actions, and views for CRUD scoped to that owner. Access is controlled via read/write/create/update/delete access settings.

Two groups:

1. **Relations plugin** (`@live-change/relations-plugin`) — Generic relations that work with any parent model:
   - [propertyOf and itemOf](/server/09-01-propertyOf-itemOf.html) — Single child per parent (property) or many children per parent (item).
   - [propertyOfAny and itemOfAny](/server/09-02-propertyOfAny-itemOfAny.html) — Same idea with a polymorphic parent (one of several types).
   - [boundTo and relatedTo](/server/09-06-boundTo-relatedTo.html) — Additional relation types.

2. **User service** (`@live-change/user-service`) — Relations that depend on User/Session/Contact and sign-in/transfer behavior:
   - [userProperty and userItem](/server/09-03-userProperty-userItem.html) — One property or many items per User.
   - [sessionOrUserProperty and sessionOrUserItem](/server/09-04-sessionOrUserProperty-sessionOrUserItem.html) — Owner is either Session or User; supports transfer on sign-in and extended identifiers (e.g. giver).
   - [contactOrUserProperty and contactOrUserItem](/server/09-05-contactOrUserProperty-contactOrUserItem.html) — Owner is Contact or User; supports contact types (email, phone) and transfer on connect.

Use **use: [ relationsPlugin ]** and/or **use: [ userService ]** in your service definition when you use these annotations.
