---
description: Rules for Vue 3, PrimeVue, Tailwind frontend development on LiveChange
globs: **/front/src/**/*.{vue,js,ts}
---

# Frontend on live-change-stack – Vue 3 + PrimeVue + Tailwind (Claude Code)

Use these rules when working on frontends that talk to LiveChange backends.

## i18n and `front/locales`

Whenever you introduce or change translated strings, follow **`live-change-frontend-i18n-locales`**: add the same keys to **all** files in that app’s **`front/locales/`** directory (every language / variant — not only one file).

## Stack

- Vue 3 + TypeScript
- PrimeVue 4 for UI components
- Tailwind CSS for styling (prefer utility classes, avoid unnecessary custom CSS)
- vite-plugin-pages for file-based routing in `src/pages/`
- `@live-change/vue3-ssr` for integration with the backend

## Data loading – `live` + `Promise.all` (Suspense)

- **Do not** use `ref(null)` + `onMounted` to fetch data.
- Always fetch data using `await Promise.all([...])` and `live(path()...)` in `script setup`.
- The root app should wrap pages with `<Suspense>` (usually handled by `ViewRoot` in live-change frontends).

Example:

```js
import { path, live, api as useApi } from '@live-change/vue3-ssr'

const api = useApi()

const [devices] = await Promise.all([
  live(path().deviceManager.myUserDevices({}))
])

const [device, connections] = await Promise.all([
  live(path().deviceManager.myUserDevice({ device: deviceId })),
  live(path().deviceManager.deviceOwnedDeviceConnections({ device: deviceId }))
])
```

In templates, use the `.value` of these refs:

```vue
<template>
  <div v-if="device.value">
    {{ device.value.name }}
  </div>
</template>
```

## One-time fetches – `useFetch` (not `api.get` with Path)

When you need a **one-time fetch** (not a live subscription), use `useFetch`:

```js
import { usePath, useFetch } from '@live-change/vue3-ssr'
const path = usePath()

const data = await useFetch(path.paperInvoice.invoiceFileInfo({ invoiceFile: fileId }))
```

**WARNING:** `path.service.view({ params })` returns a **Path object** (with `.what`, `.more`, `.to` properties), not a raw array. Do NOT pass it to `api.get()` — it will silently fail or produce wrong results.

| Pattern | Correct? |
|---|---|
| `useFetch(path.svc.view({ ... }))` | **Yes** — handles Path objects |
| `api.get(['svc', 'view', { ... }])` | **Yes** — raw array, low-level |
| `api.get(path.svc.view({ ... }))` | **NO** — Path object, will break |

## Commands and forms – choosing the right pattern

There are 4 ways to execute backend actions. Use the right one:

| Pattern | When to use |
|---|---|
| `editorData` | **Editing model records** (create/update). Drafts, validation, `AutoField`. Use for settings, editors, profiles. |
| `actionData` | **One-shot action forms** (not CRUD). Submit once → done. Use for publish, invite, import. |
| `api.command` | **Single button or programmatic calls** (no form fields). Use for delete, toggle, code-triggered actions. |
| `<command-form>` | **Avoid.** Legacy, only for trivial prototypes. Prefer `editorData` or `actionData`. |

Decision flow:

1. Does the user fill in form fields? → **No**: use `api.command` (wrap in `workingZone.addPromise` for buttons).
2. Is it editing a model record (create/update)? → **Yes**: use `editorData`. **No**: use `actionData`.
3. Only use `<command-form>` for the simplest throwaway cases.

## Autosave helpers – `synchronized` and `synchronizedList`

Use these helpers when editing reactive data from `live(...)`:

- Use `synchronized` for a single editable object.
- Use `synchronizedList` for editable list rows.
- Use shared context in `identifiers` and row-level keys in `objectIdentifiers`.
- For draft payloads, use `updateDataProperty: 'data'`.

Treat a screen as an editable list when:

- The UI uses `v-for` and each row has editable fields.
- Users edit many rows inline in one table/config/admin view.
- Autosave should persist changes row-by-row.
- Backend actions require shared list context plus row-specific keys.

For these cases, create one `synchronizedList(...)` and edit row fields through `syncList.value`.
Do not maintain a separate `id -> synchronized(...)` map for list rows.

```js
const sync = synchronized({
  source: sourceRef,
  update: actions.service.updateThing,
  identifiers: { thing: thingId },
  recursive: true,
  autoSave: true,
  debounce: 600
})

const syncList = synchronizedList({
  source: rowsRef,
  update: actions.service.updateRow,
  delete: actions.service.deleteRow,
  identifiers: { object, objectType },
  objectIdentifiers: row => ({ row: row.to, object, objectType }),
  recursive: true
})
```

Typical list flows:

- role/permission editors,
- dictionary/configuration tables,
- multi-row settings pages with inline edits.

## Form validation feedback

Every field in a form using `editorData` or `actionData` **must** show validation errors. Never use bare `InputText`, `Dropdown`, or other PrimeVue inputs without error feedback.

Three approaches (pick whichever fits the layout):

1. **AutoField without slot** — auto-picks input and shows errors. Simplest, use by default.
2. **AutoField with slot** — wrap a custom input inside `<AutoField>`. Still renders label + error automatically.
3. **Manual `Message`** — add `<Message v-if="editor.propertiesErrors?.field" severity="error" variant="simple" size="small">` below the input. Use when AutoField wrapper doesn't fit.

Always pass `:error="editor.propertiesErrors?.fieldName"` (or `formData.propertiesErrors?.fieldName` for `actionData`).

## Form element requirement

Forms using `editorData` or `actionData` with `EditorButtons` or `ActionButtons` **must** be wrapped in a `<form>` element with submit/reset handlers:

```vue
<!-- editorData -->
<form @submit.prevent="editor.save()" @reset.prevent="editor.reset()">

<!-- actionData -->
<form @submit.prevent="formData.submit()" @reset.prevent="formData.reset()">
```

`EditorButtons` and `ActionButtons` use `type="submit"` / `type="reset"` on their internal buttons. Without a `<form>` parent, these buttons do nothing.

### `api.command`

```js
await api.command(['deviceManager', 'createMyUserDevice'], {
  name: 'My device'
})

await api.command(['deviceManager', 'deleteMyUserDevice'], {
  device: id
})
```

Format:

- `['serviceName', 'actionName']` as the first argument,
- payload object as the second argument.

## Routing – `<route>` block and `meta.signedIn`

- Each page in `src/pages/` can declare its route meta in a `<route>` block.
- Use `meta.signedIn` for pages that require authentication.

```vue
<route>
  { "name": "devices", "meta": { "signedIn": true } }
</route>
```

Dynamic routes:

- `[id].vue` corresponds to `/devices/:id`.

```js
import { useRoute } from 'vue-router'

const route = useRoute()
const deviceId = route.params.id
```

## Confirm + Toast for destructive actions

```js
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const confirm = useConfirm()
const toast = useToast()

function deleteDevice(id) {
  confirm.require({
    message: 'Are you sure you want to delete this device?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      await api.command(['deviceManager', 'deleteMyUserDevice'], { device: id })
      toast.add({
        severity: 'success',
        summary: 'Deleted',
        life: 2000
      })
    }
  })
}
```

## Common UI patterns – list and detail

### List page

```vue
<template>
  <div class="container mx-auto p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Devices</h1>
      <Button label="Add" icon="pi pi-plus" @click="openDialog" />
    </div>

    <Card v-if="devices.value?.length === 0">
      <template #content>
        <p class="text-center text-gray-500">
          No devices yet
        </p>
      </template>
    </Card>

    <div class="grid gap-4">
      <Card v-for="device in devices.value" :key="device.id">
        <template #content>
          <!-- content -->
        </template>
      </Card>
    </div>
  </div>
</template>
```

### Status tag

```vue
<Tag
  :value="conn.status"
  :severity="conn.status === 'online' ? 'success' : 'secondary'"
/>
```

## Computed paths – reactive parameters

When paths depend on reactive values (route params, props), wrap them in `computed()`:

```js
import { computed, unref } from 'vue'
import { usePath, live } from '@live-change/vue3-ssr'

const path = usePath()

const articlePath = computed(() => path.blog.article({ article: unref(articleId) }))
const [article] = await Promise.all([live(articlePath)])
```

For conditional loading (e.g. only when logged in), return a falsy value:

```js
import { useClient } from '@live-change/vue3-ssr'
const client = useClient()

const myDataPath = computed(() => client.value.user && path.blog.myArticles({}))
const [myData] = await Promise.all([live(myDataPath)])
```

## Related data – `.with()`

Attach related objects to items in a single reactive query:

```js
path.blog.articles({})
  .with(article => path.userIdentification.identification({
    sessionOrUserType: article.authorType,
    sessionOrUser: article.author
  }).bind('authorProfile'))
```

Access: `article.authorProfile?.firstName`. Works with both `live()` and `RangeViewer`.

## Range lists with reactive filters

If range list `pathFunction` depends on reactive filters (month/status/search/company), prefer `ReactiveRangeViewer`.

Guidelines:

- do not rely on mutating `pathFunction` in `RangeViewer`
- avoid page-local workaround patterns with ad-hoc `:key`
- use `sourceKey` as an explicit reload trigger
- if layout stability matters, set `preserveHeightOnReload`

```vue
<ReactiveRangeViewer
  :pathFunction="transactionsPathRange"
  :sourceKey="JSON.stringify({ accountId, month: filterByMonth ? month : null })"
  :preserveHeightOnReload="true"
  :canLoadTop="false"
  canDropBottom
/>
```

## Range cursor guardrails (`RangeViewer` / `rangeBuckets`)

- For index-backed list views, backend should expose `sortedIndexRangePath`-based range views.
- Never override `range.gt/gte/lt/lte` inside frontend `pathFunction`.
- Keep cursor fields from RangeViewer intact; pass domain filters (`month`, `year`, `status`) as separate params.
- If filtering seems to require manual cursor rewriting, move logic to backend index design (or `prefixRange` fallback), not frontend hacks.

## WorkingZone for async actions

`ViewRoot` wraps every page in `<WorkingZone>`. Use `inject('workingZone')` for non-form button actions:

```js
import { inject } from 'vue'
const workingZone = inject('workingZone')

function doAction() {
  workingZone.addPromise('actionName', (async () => {
    await actions.blog.publishArticle({ article: id })
    toast.add({ severity: 'success', summary: 'Published', life: 2000 })
  })())
}
```

This activates the global loading spinner/blur while the promise is pending.

## Auth guards with `useClient`

```js
import { useClient } from '@live-change/vue3-ssr'
const client = useClient()
```

- `client.value.user` – truthy when logged in
- `client.value.roles` – array of roles (e.g. `['admin', 'owner']`)

Use in templates:

```vue
<Button v-if="client.roles.includes('admin')" label="Admin" />
<div v-if="!client.user">Please sign in</div>
```

## Locale and time

- Call `useLocale().captureLocale()` in `App.vue` to save browser locale to backend.
- Use `locale.localTime(date)` with vue-i18n's `d()` for SSR-safe date display.
- `currentTime` from `@live-change/frontend-base` is a reactive ref that ticks every 500ms.
- `useTimeSynchronization()` from `@live-change/vue3-ssr` corrects clock skew – use when timing is critical (countdowns, real-time events).

## Analytics

Use `analytics` from `@live-change/vue3-components`:

```js
import { analytics } from '@live-change/vue3-components'
analytics.emit('article:published', { articleId: id })
```

Wire providers (PostHog, GA4) in a separate file imported from `App.vue`.

## SSR and frontend configuration

- Keep separate entry points for client and server:

```js
// entry-client.js
import { clientEntry } from '@live-change/frontend-base/client-entry.js'
export default clientEntry(App, createRouter, config)

// entry-server.js
import { serverEntry, sitemapEntry } from '@live-change/frontend-base/server-entry.js'
export const render = serverEntry(App, createRouter, config)
export const sitemap = sitemapEntry(App, createRouter, routerSitemap, config)
```

- Configure PrimeVue theme in one place (e.g. `config.js`) using `definePreset` and keep dark mode options consistent.

## Discovering views and actions with `describe`

Use the CLI `describe` command to find available views (for `live()`) and actions (for `api.command` / `editorData` / `actionData`). From the app root, use **fnm exec** so Node matches `.node-version` / `.nvmrc` (see `live-change-node-toolchain-fnm`).

```bash
fnm exec -- node server/start.js describe --service blog
fnm exec -- node server/start.js describe --service blog --view articlesByCreatedAt --output yaml
fnm exec -- node server/start.js describe --service blog --action createMyUserArticle --output yaml
```

This is the fastest way to discover what paths and actions are available, including those auto-generated by relations.
