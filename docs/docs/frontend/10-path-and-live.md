---
title: Frontend – Path and live
---

# Frontend – Path and live

This chapter explains how **Path** and **live** work together to build powerful, multi-object queries on top of the Live Change DAO – including the `.with` helper that lets you pull in related objects in one reactive query.

We will reference the following implementation files:

- `dao/lib/Path.js` – the `Path` class
- `dao-vue3/lib/live.js` – the `live` and `fetch` helpers
- `dao-vue3/lib/collectPointers.js` – pointer collection used by `.with`

## Basic paths

Most DAO operations work with **paths**:

- a simple view path is an array: `['serviceName', 'viewName', params]`
- `usePath()` from `@live-change/vue3-ssr` gives you helpers that build these arrays for you.

Example:

```javascript
import { computed } from 'vue'
import { usePath, live } from '@live-change/vue3-ssr'

const path = usePath()

const identificationPath = computed(() =>
  path.userIdentification.myIdentification()
)

const identification = await live(identificationPath)
```

Here `identificationPath` resolves to a path array like:

```javascript
['userIdentification', 'myIdentification', { /* params */ }]
```

`live` then subscribes to this path and returns a reactive reference that stays in sync with the backend.

### Path objects vs raw arrays

`path.service.view({ params })` returns a **Path object** (with `.what`, `.more`, `.to` properties) — not a raw array. The `live()` and `useFetch()` functions handle Path objects correctly. However, `api.get()` expects a raw array and will **not** work with Path objects.

For one-time fetches, use `useFetch(path.service.view({ params }))` — never `api.get(path.service.view({ params }))`.

## The Path class

Internally, complex queries use the `Path` class from `dao/lib/Path.js`. It wraps a basic `what` path and augments it with:

- `more` – extra schemas describing **related objects to load**,
- `actions` – extra actions that should be bound to the objects.

Key methods:

- `with(...builders)` – describe which related objects to fetch.
- `action(name, builder)` – attach action methods to resulting objects.
- `bind(to)` – specify where related objects should be attached.
- `get(builder)` – build a schema description (used internally).

You rarely create `Path` instances manually – `usePath()` and helpers in `vue3-ssr` build them for you – but understanding it helps when reading advanced examples.

## live(api, path) – high-level behaviour

The `live` helper in `dao-vue3/lib/live.js` does the heavy lifting:

1. **Prefetch**:
   - if you pass a plain path or `Path` instance, `live` calls `api.get({ paths })` or `api.observable({ paths })` to fetch initial data and (optionally) related objects.
2. **Observation**:
   - on the client, it uses an observable for `path.what`,
   - if there is `more` or `actions`, it wraps it in an `ExtendedObservableList` that can attach related objects and bind methods.
3. **Pointer resolution**:
   - for each `more` element, `live` uses `collectPointers` to locate references to other objects inside the fetched data,
   - then it recursively calls itself (via `bindResult`) for those pointer paths and attaches the results under `moreElement.to`.
4. **Result**:
   - returns a `Ref` (or computed) whose `.value` is your object (or array) with related objects and actions already attached,
   - automatically unsubscribes and disposes resources on component unmount.

Conceptually, `live` lets you treat a complex graph of objects as **one live query**.

## `.with` – building multi-object queries

The `.with` method on `Path` is what feeds the `more` array that `live` uses.

### Examples from the codebase

Real usage of `.with` in the stack:

**Billing + balance** (`billing-frontend`, e.g. `BillingBalance.vue`): load the user’s billing and attach the balance in one query:

```javascript
path.billing.myUserBilling({})
  .with(billing => path.balance.balance({
    ownerType: 'billing_Billing',
    owner: billing.id
  }).bind('balance'))
```

**Access list + identification** (`access-control-frontend`, `AccessList.vue`): for each access entry, load the corresponding user identification:

```javascript
path().accessControl.objectOwnedAccesses({ object, objectType })
  .with(access => path().userIdentification.identification({
    sessionOrUserType: access.sessionOrUserType,
    sessionOrUser: access.sessionOrUser
  }).bind('identification'))
```

**Cron schedules + info, run state, tasks** (`task-frontend`, `CronSchedulesAdmin.vue`): for each schedule, attach extra views (info, run state, recent tasks):

```javascript
path.cron.schedules({ ...reverseRange(range) })
  .with(schedule => path.cron.scheduleInfo({ schedule: schedule.id }).bind('info'))
  .with(schedule => path.cron.runState({ jobType: 'cron_Schedule', job: schedule.id }).bind('runState'))
  .with(schedule => path.task.tasksByCauseAndCreatedAt({
    causeType: 'cron_Schedule', cause: schedule.id, reverse: true, limit: 5
  }).bind('tasks'))
```

**Image + original image** (`image-frontend`, `ImageEditor.vue`): load an image and its original (e.g. for crop) in one go:

```javascript
path().image.image({ image: props.modelValue }).with(
  image => path().image.image({ image: image.crop.originalImage }).bind('originalImage')
)
```

In each case, the builder receives a proxy of the main result (e.g. `billing`, `access`, `schedule`, `image`); you use it to build a path for the related view and call `.bind('fieldName')` so the result is attached on that field. One `live(...)` call then returns the main data with all related objects already loaded and kept in sync.

### How it works

Roughly, `.with`:

- accepts builder functions that describe what **additional paths** to follow,
- each builder receives a **proxy** that helps specify which properties to look at,
- it generates a `schema` describing which pointers to collect,
- it stores this schema (and an optional target field `to`) in `more`.

From `Path.with(...)` (simplified):

```javascript
with(...funcs) {
  let newMore = this.more ? this.more.slice() : []
  for(const func of funcs) {
    const source = sourceProxy()
    const fetchObject = func(source)
    // ...
    const more = {
      schema: [ /* description of what to fetch */ ],
      more: fetchObject.more,
      to: fetchObject.to
    }
    newMore.push(more)
  }
  return new Path(this.what, newMore, this.to, this.actions)
}
```

The **schema** is what `collectPointers` uses later to scan through the base data and find all referenced objects.

### Example: attaching related objects

Imagine a view that returns a list of events, each with a `host` field that is a pointer to a user. With `.with` you can say:

```javascript
const eventsPath = new Path(['events', 'list', { /* params */ }])
  .with(source =>
    source.host.$bind('hostUser') // load and attach host user as `hostUser`
  )
```

When `live` processes this:

- it fetches `['events', 'list', params]`,
- `collectPointers` finds all pointer values in `host`,
- for each pointer it issues additional DAO fetches,
- it attaches the results under `hostUser` on each event object.

In real projects, helpers built on top of `Path` hide this complexity, but the idea is the same.

## With + range buckets and lists

`Path.with(...)` combines well with **range-based** loading:

- your base `Path` describes the main collection (e.g. list of events or tree nodes),
- `more` describes which related objects to bring in for each bucket/item,
- `rangeBuckets` and `RangeViewer` (see logic and UI chapters) use these enriched paths to build smooth, infinite lists with rich items.

For example, in a paged list of events you can:

- show event data,
- attach host/user objects via `.with`,
- keep everything live and reactive as you scroll.

## Computed paths with reactive parameters

When paths depend on reactive values (route params, props, computed state), wrap them in `computed()`:

```javascript
import { computed, unref } from 'vue'
import { usePath, live } from '@live-change/vue3-ssr'
import { useRoute } from 'vue-router'

const path = usePath()
const route = useRoute()
const articleId = route.params.article

const articlePath = computed(() => path.blog.article({ article: unref(articleId) }))

const [article] = await Promise.all([live(articlePath)])
```

When `articleId` changes (e.g. via navigation), the path recomputes and `live` automatically resubscribes to the new data.

### Null guard for conditional loading

Return a falsy value to skip loading:

```javascript
import { useClient } from '@live-change/vue3-ssr'
const client = useClient()

// Only load when logged in
const myDataPath = computed(() => client.value.user && path.blog.myArticles({}))

// Only load for admins
const adminPath = computed(() =>
  client.value.roles.includes('admin') && path.blog.allArticles({})
)

const [myData, adminData] = await Promise.all([
  live(myDataPath),
  live(adminPath),
])
```

When the path is `null`, `false`, or `undefined`, `live()` returns a ref with `null` value and does not subscribe to the backend.

### Combining computed paths with `.with()`

```javascript
const eventPath = computed(() =>
  path.myService.event({ event: unref(eventId) })
    .with(event => path.myService.eventState({ event: event.id }).bind('state'))
    .with(event => path.userIdentification.identification({
      sessionOrUserType: event.hostType,
      sessionOrUser: event.host
    }).bind('hostProfile'))
)
```

## When to use Path/with directly

Most of the time you will:

- call `usePath()` and `live()` from `vue3-ssr`,
- let higher-level helpers build `Path` for you (for example in auto-form or custom composables).

Use `Path` and `.with` directly when:

- you need **non-trivial joins** across multiple services or models,
- you want to fetch and attach related objects in a very specific shape,
- you are building shared utilities or infrastructure for other screens.

For day-to-day screen work, prefer the existing helpers (auto-form, `synchronized`, CRUD components) and treat `Path`/`live` as the advanced tools under the hood.

