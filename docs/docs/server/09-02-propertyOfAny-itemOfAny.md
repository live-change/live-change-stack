---
title: propertyOfAny and itemOfAny
---

# propertyOfAny and itemOfAny

From **relations plugin** (`use: [ relationsPlugin ]`). Parent is **polymorphic**: one of several types (e.g. sessionOrUser, owner/topic, cause, object). You specify **to** (identifier names) and **ownerTypes** / **topicTypes** / **jobTypes** etc. (allowed type names like `['session_Session', 'user_User']` or `['cron_Interval', 'cron_Schedule']`).

- **propertyOfAny** — One child per parent; parent type can vary.
- **itemOfAny** — Many children per parent; parent type can vary.

## Arity rules

- `propertyOfAny` and `itemOfAny` are **single-config annotations**.
- Multi-dimensional ownership is expressed by `to` inside one config (for example `to: ['owner', 'topic']`).
- Do not use a list of config objects for these annotations.

Valid:

```javascript
propertyOfAny: {
  to: ['owner', 'topic'],
  ownerTypes: [...],
  topicTypes: [...]
}
```

Invalid:

```javascript
propertyOfAny: [
  { to: ['owner'], ownerTypes: [...] },
  { to: ['topic'], topicTypes: [...] }
]
```

## Auto-added fields

Polymorphic relations add **two fields** per identifier in the `to` array — a type discriminator and the value:

- `{name}Type` — type: `'type'`, enum of allowed types, validation: `['nonEmpty']`
- `{name}` — type: `'any'`, validation: `['nonEmpty']`

For example, `propertyOfAny: { to: ['owner', 'topic'] }` automatically adds four fields: `ownerType`, `owner`, `topicType`, `topic`. It also creates hash indexes: `byOwner`, `byTopic`, `byOwnerAndTopic`.

**Do not re-declare these fields in `properties`** — they are already added by the relation.

## propertyOfAny — configuration

Same access options as propertyOf, plus:

- **to** — Array of identifier names (e.g. `['owner', 'topic']`, `['sessionOrUser']`). Defaults to `['owner']` if omitted.
- **{name}Types** — Allowed parent type names for each entry in `to` (e.g. `ownerTypes`, `topicTypes`, `jobTypes`).

Example (default `to: ['owner']`):

```javascript
propertyOfAny: {
  ownerTypes: ['invoice_CostInvoice', 'invoice_IncomeInvoice']
}
```

## itemOfAny — configuration

Same access options as itemOf, plus:

- **to** — Array of identifier names or single string (e.g. `['sessionOrUser']`, `'cause'`). Defaults to `['owner']` if omitted.
- **{name}Types** — Allowed parent type names (e.g. `ownerTypes`, `sessionOrUserTypes`, `jobTypes`, `contactOrUserTypes`), depending on `to`.

## Example: propertyOfAny (Schedule, Interval — cron-service)

```javascript
// Source: live-change-stack/services/cron-service/schedule.js

export const Schedule = definition.model({
  name: "Schedule",
  propertyOfAny: {
    to: ['owner', 'topic'],
    ownerTypes: config.ownerTypes,
    topicTypes: config.topicTypes,
    writeAccessControl: { roles: config.adminRoles, objects: scheduleAccessControlObjects },
    readAccessControl: { roles: config.adminRoles, objects: scheduleAccessControlObjects },
    readAllAccess: ['admin']
  },
  properties: {
    description: { type: String },
    minute: { type: Number },
    hour: { type: Number },
    day: { type: Number },
    dayOfWeek: { type: Number },
    trigger: triggerType
  }
})
```

## Example: itemOfAny (Task — task-service)

```javascript
// Source: live-change-stack/services/task-service/model.js

const Task = definition.model({
  name: 'Task',
  itemOfAny: {
    to: 'cause',
    readAccess: () => true
  },
  properties: { name, service, definition, properties, client, result, hash, state, startedAt, ... },
  indexes: { byCauseAndHash, byCauseAndState, ... }
})
```

## Example: RunState (cron run — job is Interval or Schedule)

```javascript
// Source: live-change-stack/services/cron-service/run.js

export const RunState = definition.model({
  name: "RunState",
  propertyOfAny: {
    to: ['job'],
    jobTypes: ['cron_Interval', 'cron_Schedule'],
    readAccessControl: { roles: [...config.adminRoles, ...config.readerRoles] }
  },
  properties: {
    state: { type: String, enum: ['running', 'waiting'] },
    tasks: { type: Array, of: { type: Task } },
    startedAt: { type: Date },
    returnTask: { type: Boolean }
  }
})
```

User-service uses **propertyOfAny** / **itemOfAny** internally for sessionOrUser and contactOrUser with **sessionOrUserTypes** / **contactOrUserTypes**; see [sessionOrUserProperty / sessionOrUserItem](/server/09-04-sessionOrUserProperty-sessionOrUserItem.html) and [contactOrUserProperty / contactOrUserItem](/server/09-05-contactOrUserProperty-contactOrUserItem.html).
