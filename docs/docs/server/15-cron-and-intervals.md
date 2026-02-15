---
title: Cron and intervals
---

# Cron and intervals

The **cron service** (`@live-change/cron-service`) runs code at fixed times (**Schedule** — cron-like) or on a fixed interval (**Interval**). It uses the **task service** to execute triggers; you configure which **trigger** (service + name + properties) to run. Add **cron** (and **task**) to your app config and **cronService** to **use** when defining triggers that cron will call.

## Dependencies

```javascript
// Source: live-change-stack/services/cron-service/definition.js

import taskService from '@live-change/task-service'

const definition = app.createServiceDefinition({
  name: "cron",
  use: [ relationsPlugin, accessControlService, taskService ]
})
```

## Schedule (cron-like)

**Schedule** is a **propertyOfAny** with **owner** and **topic**. Properties include:

- **minute**, **hour**, **day**, **dayOfWeek** — Numbers or NaN for “every” (e.g. NaN for minute = every minute).
- **trigger** — Object: **name**, **service**, **properties**, **returnTask**. When the schedule fires, the cron service calls **triggerService({ type: trigger.name, service: trigger.service, causeType: 'cron_Schedule', cause: scheduleId }, { ...trigger.properties })**. If **returnTask** is true, the run waits for the task.

Access is controlled by **ownerTypes** / **topicTypes** and **writeAccessControl** / **readAccessControl** (e.g. admin roles).

## Interval (repeating delay)

**Interval** is a **propertyOfAny** with **owner** and **topic**. Properties include:

- **interval** — Milliseconds between runs.
- **firstRunDelay** — Optional delay before first run.
- **wait** — If set, wait for the previous run to finish before scheduling the next.
- **trigger** — Same shape as Schedule (name, service, properties, returnTask).

**IntervalInfo** (propertyOf Interval) stores **lastRun** and **nextRun** for each interval.

## Run and RunState

When a schedule or interval fires, the service creates a **RunState** (propertyOfAny to **job**, jobTypes: `['cron_Interval', 'cron_Schedule']`) with state **running** or **waiting**, and optionally a **tasks** array (task service tasks). **doRunTrigger(triggerInfo, context)** runs **triggerService** with the trigger name and service; if **returnTask** is true, the run can wait for the task to complete.

## Config

**config.js** (or definition.config) can set **adminRoles**, **readerRoles**, **ownerTypes**, **topicTypes** to control who can create/edit schedules and intervals and who can read them.

## Defining a trigger that cron can call

In your service, define a **trigger** that the cron job will invoke:

```javascript
definition.trigger({
  name: 'myScheduledJob',
  properties: { ... },
  async execute(props, { triggerService, ... }, emit) {
    // run your logic
  }
})
```

Then create a Schedule or Interval (via cron service actions/views) with **trigger: { name: 'myScheduledJob', service: 'yourService', properties: { ... }, returnTask: false }**. The cron worker will call this trigger at the configured times or intervals.
