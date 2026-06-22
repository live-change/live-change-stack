---
name: live-change-backend-tasks-cron
description: Define batch work with task-service, wire cron intervals via runTask_* triggers and returnTask
---

# Skill: live-change-backend-tasks-cron

Use when adding **scheduled or batch backend work** that should be visible in **`/_task`** (progress, retries, parent/child tree) and optionally tied to **`/_cron`** intervals.

## When to use `task()` vs bare `definition.trigger`

| Use **`task({ ... }, definition)`** | Use bare **`definition.trigger`** |
|-------------------------------------|-----------------------------------|
| Ingest, sync, multi-step batch | One-shot synchronous hook |
| Needs progress / admin UI | No observability needed |
| Parent + child steps (`task.run`) | Single quick mutation |

## Setup

```js
import { task } from '@live-change/task-service'

// service definition must include taskService in use:
// use: [relationsPlugin, taskService, ...]
```

## Define tasks

```js
const childTask = task({
  name: 'processItem',
  properties: { id: { type: String } },
  async execute({ id }, { triggerService, task }, emit) {
    // work...
    return { ok: true }
  }
}, definition)

const batchTask = task({
  name: 'fetchAll',
  properties: {},
  async execute(props, { task }, emit) {
    const ids = await loadIds()
    const queue = new PQueue({ concurrency: 5 })
    await Promise.all(ids.map(id =>
      queue.add(() => task.run(childTask, { id }, 1))
    ))
    return { queued: ids.length }
  }
}, definition)
```

Auto trigger names (unless `trigger: 'customName'` on task def):

- **`runTask_{serviceName}_{taskName}`** — e.g. `runTask_hackerNewsIngestion_fetchLatestStories`

Trigger **returns task id**, not the return value of `execute`.

## Cron interval

In **`definition.afterStart`** or an action:

```js
await app.triggerService(
  { service: 'cron', type: 'cron_setOrUpdateInterval' },
  {
    ownerType: 'system',
    owner: 'myService',
    topicType: 'system',
    topic: 'fetchAll',
    description: '...',
    interval: 15 * 60 * 1000,
    firstRunDelay: 30 * 1000,
    wait: true,
    trigger: {
      name: 'runTask_myService_fetchAll',
      service: definition.name,
      properties: {},
      returnTask: true
    }
  }
)
```

- **`returnTask: true`** — cron **RunState** waits for the Task to finish.
- **`wait: true`** — do not plan the next interval tick until the previous run ended.

Disable in tests: `INGEST_ENABLED=false` in bootstrap + `cron_resetInterval` on afterStart when disabled.

## Observability

- Tasks: **`/_task`** (task-frontend routes in app router).
- Cron: **`/_cron`** — row **`.with()`** → **`intervalInfo`**, **`runState`**, **`task.tasksByCauseAndCreatedAt`** (`causeType: 'cron_Interval'`, `cause: intervalId`).
- Child tasks: **`causeType: 'task_Task'`**, **`cause: parentTaskId`**.

## References

- Framework: `live-change-stack/docs/docs/server/14-tasks.md`, `15-cron-and-intervals.md`
- Code: `vole-apps/apps/server/ads-api-service/accounts.js`
- Project: `techno-radar/server/hackerNewsIngestion/tasks.js`, `redditIngestion/tasks.js`

## Related

- Model change reactions: skill **live-change-backend-change-triggers** (not for cron batch).
