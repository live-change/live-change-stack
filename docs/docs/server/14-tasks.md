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

## Trigger flow

When a task is created, the framework emits triggers such as **taskCreated**, **taskDone**, **taskFailed**, and cause-specific triggers like **&lt;causeType&gt;_&lt;cause&gt;OwnedTask&lt;TaskName&gt;&lt;State&gt;** so other services can react (e.g. update UI or run follow-up logic).
