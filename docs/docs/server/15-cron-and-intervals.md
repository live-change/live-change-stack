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

## API used by task-frontend (admin UI)

The **task-frontend** package ships example admin pages for cron (`CronSchedulesAdmin.vue`, `CronIntervalsAdmin.vue`). They show the intended client-side integration: **ActionForm** for create, **RangeViewer** for listing, **`.with()`** to join related views, and direct **actions** for delete.

### Actions (relations CRUD)

Schedules and intervals are **`propertyOfAny`** models. The relations layer exposes the usual set/create/update/delete actions. In practice the UI uses:

| Action | Purpose |
|--------|---------|
| **`cron.setSchedule`** | Create or replace a **Schedule** (identifiers + schedule fields + **trigger**). |
| **`cron.deleteSchedule`** | Delete a schedule by id, e.g. `{ schedule: scheduleId }`. |
| **`cron.setInterval`** | Create or replace an **Interval**. |
| **`cron.deleteInterval`** | Delete an interval by id, e.g. `{ interval: intervalId }`. |

Use **`ActionForm`** with `service="cron"` and `action="setSchedule"` or `action="setInterval"` so the form is driven by action metadata (owner/topic identifiers, typed fields, **trigger** JSON).

### Views used in lists

Admin lists load rows through DAO paths (typically inside **`RangeViewer`**). Typical paths:

| View / path | Role |
|-------------|------|
| **`path.cron.schedules(range)`** | Paginated list of **Schedule** rows (pass range from the viewer; often wrap with **`reverseRange(range)`** for display order). |
| **`path.cron.intervals(range)`** | Same for **Interval**. |
| **`path.cron.scheduleInfo({ schedule })`** | **ScheduleInfo** — **lastRun** / **nextRun** for one schedule. |
| **`path.cron.intervalInfo({ interval })`** | **IntervalInfo** for one interval. |
| **`path.cron.runState({ jobType, job })`** | **RunState** for the current run (`jobType`: `'cron_Schedule'` or `'cron_Interval'`, **`job`**: schedule or interval id). |
| **`path.task.tasksByCauseAndCreatedAt({ causeType, cause, ... })`** | Recent **task** rows caused by this schedule/interval (e.g. `causeType: 'cron_Schedule'`, `cause: scheduleId`). |

Example pattern (schedules): chain **`.with()`** on each row to attach **`info`**, **`runState`**, and **`tasks`** without N+1 round-trips:

```javascript
const schedulesPathFunction = computed(() => (range) =>
  path.cron.schedules({ ...reverseRange(range) })
    .with(schedule => path.cron.scheduleInfo({ schedule: schedule.id }).bind('info'))
    .with(schedule => path.cron.runState({ jobType: 'cron_Schedule', job: schedule.id }).bind('runState'))
    .with(schedule => path.task.tasksByCauseAndCreatedAt({
      causeType: 'cron_Schedule', cause: schedule.id, reverse: true, limit: 5
    }).bind('tasks'))
)
```

Delete from the UI calls the action API, e.g. **`api.actions.cron.deleteSchedule({ schedule: id })`** (same idea for intervals).

### Schedule fields and “wildcard” numbers

**Schedule** properties (see `cron-service` model definition):

- **`minute`**, **`hour`**, **`day`**, **`dayOfWeek`**, **`month`** — each is a **Number**.
- **Integer** value — pin that field (e.g. `minute: 30` → at minute 30).
- **`NaN`** — treat as “every” for that field (e.g. `NaN` for **minute** → run every minute within the constraints of the other fields).

**`dayOfWeek`** uses **1–7** (1 = Sunday in the cron service UI helpers). **`month`** is **1–12**. Combine fields to express cron-like rules; the service computes the next run and stores it on **ScheduleInfo** (**nextRun**) and updates **lastRun** after a run.

### Intervals — same UI ideas

- **`setInterval`** / **`deleteInterval`** for mutations.
- **`path.cron.intervals`**, **`path.cron.intervalInfo`**, **`path.cron.runState`** with `jobType: 'cron_Interval'`, and **`tasksByCauseAndCreatedAt`** with `causeType: 'cron_Interval'`.

### Relation to timers and change triggers

- Each **Schedule** / **Interval** is backed by **timer** create/cancel (see **`changeCron_Schedule`** / **`changeCron_Interval`** triggers in the service). Admin UIs do not call the timer service directly; they use **cron** actions and views.
- When designing a new scheduled feature, plan **cron-service** (model + trigger target + optional **changeCron_*** hooks), not only a raw timer.
