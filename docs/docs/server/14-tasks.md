---
title: Tasks
---

# Tasks

The **task service** (`@live-change/task-service`) runs background work that can be retried, report progress, and be observed by cause (e.g. “all tasks for this event”). Add **taskService** to your service **use** and call the exported **task** API to define and run tasks.

## Dependencies

```javascript
// Source: live-change-stack/services/task-service/definition.js

import taskService from '@live-change/task-service'

const definition = app.createServiceDefinition({
  name: "myService",
  use: [ relationsPlugin, accessControlService, taskService ]
})
```

## Task definition

A task is defined by an object with **name**, **execute**, and optional **expire**, **maxRetries**, **trigger**, **action**, **service**:

- **name** — Unique task name.
- **execute(props, context, emit)** — Async function that runs the work. **context** has **task** (id, run, progress, trigger, triggerService), **trigger**, **triggerService**, **causeType**, **cause**.
- **expire** — Optional TTL in ms; tasks older than this can be reused by hash.
- **maxRetries** — Default 5.
- **retryDelay** — Optional (retryCount) => ms.
- **trigger** — If set, a trigger with this name (or type) is created so other code can start the task via trigger.
- **action** — If set, an action is created that enqueues the task.
- **service** — Service name (default current service).

## Running a task

Use the **task** export from `@live-change/task-service`:

```javascript
import task from '@live-change/task-service'
```

Then call **task.run(taskDefinition, props, causeType, cause, expire?, client)**. It will create or reuse a task (by hash of name + props + user/session), emit the create event if new, and run **execute**. Returns **{ task, taskObject, promise, causeType, cause }**.

Example (conceptual): from a trigger you call `task.run(myTaskDef, { id: 'x' }, 'speedDating_Event', eventId, null, { user: client.user, session: client.session })`. Listen for task state triggers (e.g. taskCreated, taskDone, taskFailed) to react to completion.

## Task model and views

Tasks are stored as **Task** with **itemOfAny** to **cause** (causeType, cause). Views include **task** (single), **tasksByCauseAndHash**, **tasksByCauseAndState**, **tasksByCauseAndStart**, etc. Use **app.serviceViewGet('task', 'task', { task: id })** or **tasksByCauseAndState** to observe progress.

## Auto-generated trigger (`runTask_*`)

When you call **`task({ name, properties, execute }, serviceDefinition)`**, the plugin registers a trigger:

- Default name: **`runTask_{serviceName}_{taskName}`** (e.g. `runTask_hackerNewsIngestion_fetchLatestStories`).
- Custom name: set **`trigger: 'myTriggerName'`** on the task definition (then use that name in cron).

The trigger’s **`execute`** calls **`startTask`**, creates or reuses a **Task** row, runs **`execute`**, and **returns the task id** (not the task result object). Use **`app.serviceViewGet('task', 'task', { task: id })`** to poll **state** (`created`, `running`, `done`, `failed`).

## Subtasks with `task.run`

Inside **`execute(props, { task, triggerService, ... }, emit)`**, call **`await task.run(childTaskFunction, props, progressFactor)`**:

- **childTaskFunction** — the function returned by **`task({ ... }, definition)`** (not the trigger name).
- **progressFactor** — optional weight for aggregated progress on the parent (default `1`).
- The child task gets **`causeType: 'task_Task'`** and **`cause: parentTaskId`**, so **`tasksByCauseAndCreatedAt`** on the parent shows the tree in admin UI.

Use **`task.progress(current, total, action)`** or **`progress.slice`** (see ads-api `accounts.js`) for multi-step parent tasks.

Rate limiting (API quotas) stays in your code — e.g. **`p-queue`** inside the parent **`execute`** while calling **`task.run`** per item.

## Task + cron interval

For repeating or scheduled batch work with observability:

1. Define work with **`task()`** (not a bare **`definition.trigger`**).
2. Register an **Interval** (or **Schedule**) via **`cron_setOrUpdateInterval`** with:

```javascript
trigger: {
  name: 'runTask_myService_myTask',  // must match the auto trigger name
  service: 'myService',
  properties: { /* passed to the task */ },
  returnTask: true   // cron RunState waits until the Task finishes
}
```

3. **`causeType`** on the root task is typically **`cron_Interval`** (or **`cron_Schedule`**) with **`cause`** = interval/schedule id — visible under that cron row in **`tasksByCauseAndCreatedAt`**.

See **[Cron and intervals](./15-cron-and-intervals.md)** for **`wait`** vs **`returnTask`**.

## Trigger flow

When a task is created, the framework emits triggers such as **taskCreated**, **taskDone**, **taskFailed**, and cause-specific triggers like **&lt;causeType&gt;_&lt;cause&gt;OwnedTask&lt;TaskName&gt;&lt;State&gt;** so other services can react (e.g. update UI or run follow-up logic).
