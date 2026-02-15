---
title: propertyOfAny and itemOfAny
---

# propertyOfAny and itemOfAny

From **relations plugin** (`use: [ relationsPlugin ]`). Parent is **polymorphic**: one of several types (e.g. sessionOrUser, owner/topic, cause, object). You specify **to** (identifier names) and **ownerTypes** / **topicTypes** / **jobTypes** etc. (allowed type names like `['session_Session', 'user_User']` or `['cron_Interval', 'cron_Schedule']`).

- **propertyOfAny** — One child per parent; parent type can vary.
- **itemOfAny** — Many children per parent; parent type can vary.

## propertyOfAny — configuration

Same access options as propertyOf, plus:

- **to** — Array of identifier names (e.g. `['owner', 'topic']`, `['sessionOrUser']`).
- **ownerTypes** / **topicTypes** / etc. — Allowed parent type names for each “to” dimension (depending on plugin/service usage).

## itemOfAny — configuration

Same access options as itemOf, plus:

- **to** — Array of identifier names or single string (e.g. `['sessionOrUser']`, `'cause'`).
- **ownerTypes** / **sessionOrUserTypes** / **jobTypes** / **contactOrUserTypes** — Allowed parent type names.

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
