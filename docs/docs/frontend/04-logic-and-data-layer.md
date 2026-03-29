---
title: Frontend – Logic and data layer
---

# Frontend – Logic and data layer

This chapter describes how the frontend works with the Live Change data layer:

- `@live-change/vue3-ssr` – access to DAO, views, actions, models, metadata
- `@live-change/dao-vue3` – `live` and `fetch` helpers
- logic components from `@live-change/vue3-components` – `LoadingZone`, `WorkingZone`, `synchronized`, etc.

## vue3-ssr – hooks and API

Key hooks:

- `useApi()` – main API object, with metadata, validators and helpers
- `usePath()` – builds DAO paths (views, actions)
- `live(path)` – reactive subscription to a view (returns a `Ref`)
- `useFetch(path)` – one-off fetch of a view (Promise)
- `useViews()`, `useActions()` – convenient namespaces
- `useClient()` – current user / session / roles

### Loading data with `live` and `Promise.all`

Always load data in parallel with `Promise.all`. This is also how SSR prefetch is triggered automatically via Suspense:

```javascript
import { computed } from 'vue'
import { usePath, live, useActions } from '@live-change/vue3-ssr'

const path = usePath()
const actions = useActions()

const props = defineProps({ article: { type: String, required: true } })

const [ article, comments ] = await Promise.all([
  live(computed(() => path.blog.article({ article: props.article }))),
  live(computed(() => path.blog.articleComments({ article: props.article })))
])
```

In the template:

```vue
<template>
  <h1>{{ article.value?.title }}</h1>
  <div v-for="comment in comments.value" :key="comment.id">
    {{ comment.body }}
  </div>
</template>
```

### One-time fetches with `useFetch`

Use `useFetch` when you need data once without a live subscription (e.g. after an upload, in an event handler):

```javascript
import { usePath, useFetch } from '@live-change/vue3-ssr'
const path = usePath()

const data = await useFetch(path.paperInvoice.invoiceFileInfo({ invoiceFile: fileId }))
```

> **Warning:** `path.service.view({ params })` returns a **Path object**, not a raw array. Do NOT pass it to `api.get()` — it expects raw arrays like `['service', 'view', { params }]`. Use `useFetch` instead.

| Method | Input | Returns | Use when |
|---|---|---|---|
| `live(path)` | Path or array | Reactive Ref | You need live-updating data |
| `useFetch(path)` | Path or array | Promise | One-time fetch in setup or event handler |
| `api.get(['svc', 'view', params])` | Raw array | Promise | Low-level, avoid in application code |

### Calling actions

```javascript
await actions.blog.deleteArticle({ article: props.article })
```

Or via `useApi().command`:

```javascript
const api = useApi()
await api.command(['blog', 'deleteArticle'], { article: props.article })
```

## Logic components from vue3-components

`@live-change/vue3-components` provides components and helpers:

- `LoadingZone`, `WorkingZone`, `LoadingWorkingZone` – wrap async operations with loading/working/error states
- `synchronized`, `synchronizedList` – editable data with autosave
- `analytics`, `useAnalytics`, `installRouterAnalytics` – analytics events
- `useLocale` – user language/locale management
- `validateData` – client-side validation using server definitions

### WorkingZone and LoadingZone

`ViewRoot` (from `frontend-base`) already wraps every page in a `LoadingZone` + `WorkingZone` pair. The `LoadingZone` shows a spinner while Suspense resolves; the `WorkingZone` blurs the page and shows a spinner while commands are in progress. You do not have to add either component to get this global behaviour.

#### Calling commands with workingZone

Any component inside `ViewRoot` can inject the working zone and use it to register the progress of a command. The component will show the page-level spinner while the promise is pending:

```javascript
import { inject } from 'vue'
import { useActions } from '@live-change/vue3-ssr'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const actions = useActions()
const toast = useToast()
const confirm = useConfirm()
const workingZone = inject('workingZone')

function deleteArticle(id) {
  confirm.require({
    message: 'Delete this article?',
    header: 'Confirm',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      workingZone.addPromise('deleteArticle', (async () => {
        await actions.blog.deleteArticle({ article: id })
        toast.add({ severity: 'success', summary: 'Deleted', life: 2000 })
      })())
    }
  })
}
```

`workingZone.addPromise(name, promise)` – registers the promise under a descriptive name. While it is pending, the zone shows its `#working` slot (globally: the spinner + blur). When it resolves or rejects the zone clears.

> `editorData` calls `workingZone.addPromise` internally for save operations, so forms using `editorData` integrate with the working zone automatically.

#### Local WorkingZone for a sub-section

If you want the loading/working indicator to be scoped to a specific part of the page rather than the whole screen, wrap that section in its own `WorkingZone`:

```vue
<template>
  <working-zone>
    <template #working>
      <div class="flex justify-center py-4">
        <ProgressSpinner animationDuration=".5s" />
      </div>
    </template>
    <template #default="{ isWorking }">
      <div :class="{ 'opacity-50 pointer-events-none': isWorking }">
        <Button label="Publish" @click="publish" />
        <Button label="Archive" @click="archive" severity="secondary" />
      </div>
    </template>
  </working-zone>
</template>

<script setup>
import { inject } from 'vue'
const workingZone = inject('workingZone')

function publish() {
  workingZone.addPromise('publish', actions.blog.publishArticle({ article: props.article }))
}
</script>
```

The innermost `WorkingZone` is triggered by `inject('workingZone')` from its descendants.

#### LoadingWorkingZone – both in one

`LoadingWorkingZone` combines `LoadingZone` and `WorkingZone` into a single component. Useful when you need Suspense + command feedback for a sub-section:

```vue
<loading-working-zone suspense>
  <template #loading>
    <ProgressSpinner />
  </template>
  <template #working>
    <ProgressSpinner />
  </template>
  <template #default>
    <SomeAsyncComponent />
  </template>
</loading-working-zone>
```

#### Slots summary

Both `WorkingZone` and `LoadingZone` expose the same slot structure:

| Slot | When rendered | Slot props |
|---|---|---|
| `#default` | always | `{ isWorking }` / `{ isLoading }` |
| `#working` / `#loading` | while in progress | – |
| `#error` | on failure | `{ errors }` |

### synchronized – editable data with autosave

`synchronized` creates a reactive, editable copy of a view's data and automatically saves changes back via an action:

```javascript
import { computed, toRefs } from 'vue'
import { usePath, live, useActions } from '@live-change/vue3-ssr'
import { synchronized } from '@live-change/vue3-components'

const path = usePath()
const actions = useActions()
const props = defineProps({ article: { type: String, required: true } })
const { article } = toRefs(props)

const articlePath = computed(() => path.blog.article({ article: article.value }))
const [ articleData ] = await Promise.all([
  live(articlePath)
])

const synchronizedArticle = synchronized({
  source: articleData,
  update: actions.blog.updateArticle,
  identifiers: { article: article.value },
  recursive: true,
  autoSave: true,
  debounce: 600,
  onSave: () => toast.add({ severity: 'info', summary: 'Saved', life: 1500 })
})

const editable = synchronizedArticle.value   // Ref to editable data
const changed = synchronizedArticle.changed  // Ref<boolean>
const saving = synchronizedArticle.saving    // Ref<boolean>
const save = synchronizedArticle.save        // manual save trigger
```

`editable` is passed directly to `AutoEditor` or `AutoField` components (see chapter 05).

Warn the user about unsaved changes before leaving the page:

```javascript
import { onMounted, onUnmounted } from 'vue'

function beforeUnload(ev) {
  if(changed.value) return ev.returnValue = 'You have unsaved changes!'
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
```

### synchronized + draft – user drafts

For user-facing forms where you want to auto-save a draft before the final submit:

```javascript
import { computed } from 'vue'
import { usePath, live, useActions } from '@live-change/vue3-ssr'
import { synchronized } from '@live-change/vue3-components'

const path = usePath()
const actions = useActions()

const draftIdentifiers = {
  actionType: 'setOrUpdateMyProfile', action: 'profile',
  targetType: 'profile', target: 'myProfile'
}

const [ profileData, draft ] = await Promise.all([
  live(path.profile.myProfile()),
  live(path.draft.myDraft(draftIdentifiers))
])

const initialData = computed(() => profileData.value && {
  firstName: profileData.value.firstName,
  lastName: profileData.value.lastName,
  bio: profileData.value.bio
})

const synchronizedDraft = synchronized({
  source: computed(() => draft.value?.data ?? initialData.value),
  update: actions.draft.setOrUpdateMyDraft,
  updateDataProperty: 'data',
  identifiers: draftIdentifiers,
  recursive: true,
  autoSave: true,
  debounce: 600
})

const { value: editable, changed, saving, save: saveDraft } = synchronizedDraft
```

On final submit:

```javascript
async function saveProfile() {
  await actions.profile.setOrUpdateMyProfile(editable.value)
  if(draft.value) await actions.draft.resetMyDraft(draftIdentifiers)
}
```

This gives you:

- automatic draft saving while the user types,
- an easy bridge to the final save action,
- a way to detect and warn about unsaved changes.

## Range buckets and RangeViewer

For long, scrollable lists backed by DAO ranges the stack provides:

- `rangeBuckets` from `@live-change/vue3-ssr`
- `RangeViewer` from `@live-change/vue3-components`

### rangeBuckets (vue3-ssr)

`rangeBuckets` manages **paged slices of a DAO range**. It:

- takes a `pathFunction(range, pathHelpers)` that builds a view path based on a range descriptor,
- accepts options like `bucketSize`, `initialPosition`, `softClose`,
- returns an object with:
  - `buckets` – an array of buckets with `data`,
  - `loadTop` / `loadBottom` – to load more buckets,
  - `dropTop` / `dropBottom` – to drop buckets that scrolled out of view,
  - `freeze` / `unfreeze` – to pause/resume updates,
  - `changed` – a reactive flag for when underlying data has changed.

### RangeViewer (vue3-components)

`RangeViewer` wraps `rangeBuckets` and provides a declarative way to render a scrollable list.

Key props:

| Prop | Default | Description |
|---|---|---|
| `pathFunction` | required | `(range) => path` – builds the DAO path for a given range |
| `bucketSize` | `20` | Items per page |
| `canLoadTop` / `canLoadBottom` | `true` | Whether loading in each direction is allowed |
| `canDropTop` / `canDropBottom` | `false` | Whether to drop pages that scrolled far out of view |
| `loadBottomSensorSize` | `'500px'` | How far before the bottom to trigger loading (increase for smoother UX, e.g. `'3000px'`) |
| `dropBottomSensorSize` | `'5000px'` | How far to keep before dropping |
| `frozen` | `false` | Pause live updates |
| `softClose` | `false` | Soft closing of bucket boundaries |

Slots:

- default slot – receives `{ item, bucket, itemIndex, bucketIndex }`,
- `empty` – rendered when there are no items,
- `loadingTop` / `loadingBottom` – spinners at the ends,
- `changedTop` / `changedBottom` – markers when data changed while frozen.

### Newest-first with `reverseRange()`

Most lists display items newest-first. Use `reverseRange()` to flip the range:

```javascript
import { reverseRange } from '@live-change/vue3-ssr'

function articlesPathRange(range) {
  return path.blog.articlesByCreatedAt({ ...reverseRange(range) })
}
```

### Full example with `.with()`

```vue
<template>
  <RangeViewer
    :pathFunction="articlesPathRange"
    :canLoadTop="false"
    canDropBottom
    loadBottomSensorSize="3000px"
    dropBottomSensorSize="5000px"
  >
    <template #empty>
      <p class="text-center text-surface-500 my-4">No articles yet.</p>
    </template>
    <template #default="{ item: article }">
      <Card class="mb-2">
        <template #content>
          <h3>{{ article.title }}</h3>
          <p class="text-sm text-surface-500">By {{ article.authorProfile?.firstName }}</p>
        </template>
      </Card>
    </template>
  </RangeViewer>
</template>

<script setup>
  import { usePath, reverseRange } from '@live-change/vue3-ssr'
  const path = usePath()

  function articlesPathRange(range) {
    return path.blog.articlesByCreatedAt({ ...reverseRange(range) })
      .with(article => path.userIdentification.identification({
        sessionOrUserType: article.authorType,
        sessionOrUser: article.author
      }).bind('authorProfile'))
  }
</script>
```

`pathFunction` can use `.with(...)` to attach related objects to each item (see [Path and live](10-path-and-live.md)).

### WorkingZone for button actions

When a button triggers an async action outside a form, use `workingZone.addPromise()` to activate the global loading spinner:

```javascript
import { inject } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useActions } from '@live-change/vue3-ssr'

const workingZone = inject('workingZone')
const toast = useToast()
const actions = useActions()

function publishArticle(id) {
  workingZone.addPromise('publishArticle', (async () => {
    await actions.blog.publishArticle({ article: id })
    toast.add({ severity: 'success', summary: 'Published', life: 2000 })
  })())
}
```

`ViewRoot` wraps every page in a `<WorkingZone>`, so the `workingZone` injection is always available. While any promise is pending, the page content is blurred and a spinner is shown.

## Summary

- `vue3-ssr` provides access to DAO, metadata and SSR.
- `live` / `Promise.all` is the standard pattern for reactive data loading.
- `synchronized` manages editable data with autosave; use the draft variant for user-facing forms.
- `rangeBuckets` and `RangeViewer` are the core tools for efficient, scrollable range-based lists.

On top of this layer you build:

- forms and CRUDs (`05-forms-and-auto-form`)
- analytics and marketing pages (`07-analytics-and-marketing`)
- your own domain logic abstractions.
