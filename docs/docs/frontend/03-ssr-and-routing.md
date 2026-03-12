---
title: Frontend – SSR and routing
---

# Frontend – SSR and routing

This chapter describes how SSR and routing work in Live Change frontend apps built on:

- `@live-change/frontend-base` (client/server entry, `ViewRoot`)
- `@live-change/vue3-ssr` (client API, SSR cache)
- Vite + `vue-router` (with `vite-plugin-pages` for file-based routes)

## SSR – high-level flow

When the server starts:

1. `server/start.js` loads `app.config.js` and `services.list.js`.
2. `@live-change/cli` runs:
   - the API server (WebSocket/SockJS),
   - the SSR server (Vite + Node),
   - optional DB and services (`--withDb`, `--withServices`, `--updateServices`).
3. On the server, `@live-change/vue3-ssr`:
   - creates a DAO connected to services,
   - fetches API metadata (`metadata/api`),
   - performs `preFetch` for views needed for SSR,
   - serialises the DAO cache and software version into HTML.

On the client:

1. The frontend reads the DAO cache and version from `window.__DAO_CACHE__` and `window.__VERSION__`.
2. `vue3-ssr` reconstructs the API and metadata.
3. Vue performs **hydration** of the component tree.

## Routing

Routing is based on `vue-router` 4. The recommended setup uses `vite-plugin-pages` for file-based routes:

- `pages/index.vue` → `/`
- `pages/articles/index.vue` → `/articles`
- `pages/articles/[article]/index.vue` → `/articles/:article`
- `pages/articles/[article]/edit.vue` → `/articles/:article/edit`
- `pages/articles/[article]/_print/index.vue` → special variant (e.g. print layout)

Each page can declare route metadata in a `<route>` block:

```vue
<route>
  { "name": "article:edit", "meta": { "signedIn": true } }
</route>
```

Route params are received as component props (configured in `router.js` with `props: true`, which `vite-plugin-pages` sets automatically for parameterised routes):

```vue
<script setup>
const props = defineProps({
  article: { type: String, required: true }
})
</script>
```

## ViewRoot and layout

In `App.vue` you use `ViewRoot` from `@live-change/frontend-base` as the main layout:

```vue
<template>
  <view-root>
    <template #navbar>
      <NavBar />
      <UpdateBanner />
    </template>
  </view-root>
</template>
```

`ViewRoot` mounts the router outlet inside it, so every page under `pages/*` is rendered in that context.

## Data prefetch for SSR

`@live-change/vue3-ssr` exposes:

- `api.preFetch()` – general prefetch (metadata, global paths)
- `api.preFetchRoute(route, router)` – per-route prefetch based on `reactivePreFetch` defined on components.

In a page component you can define:

```javascript
MyPage.reactivePreFetch = function(route, router) {
  return [
    { what: ['metadata', 'api'] },
    { what: ['version', 'version'] },
    { what: ['myService', 'myView', { id: route.params.id }] }
  ]
}
```

On the SSR server:

1. `reactivePreFetch` is called for components matched by the route.
2. `dao.get({ paths })` is executed and results are stored in the SSR cache.
3. The cache is passed to the client in the generated HTML.

In practice, most pages use `await live(...)` in `<script setup>`, which handles SSR prefetch automatically via Suspense.

## Working with the route in components

Typical setup in a page:

```javascript
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { client as useClient, useApi, usePath, live } from '@live-change/vue3-ssr'
import { useI18n } from 'vue-i18n'

const api = useApi()
const client = useClient()
const path = usePath()
const route = useRoute()
const { locale: i18nLocale } = useI18n()

useHead(computed(() => ({
  title: api.metadata.config.value.brandName,
  htmlAttrs: {
    lang: i18nLocale.value,
    class: { 'app-dark-mode': !route.meta.lightMode }
  }
})))
```

## Authentication guard

The router's `beforeEach` hook enforces `meta.signedIn` routes:

```javascript
router.beforeEach(async (to) => {
  if(typeof window === 'undefined') return // skip on server
  if(to?.matched.find(m => m?.meta.signedIn) && !client.value.user) {
    localStorage.redirectAfterSignIn = JSON.stringify(to.fullPath)
    return { name: 'user:signInEmail' }
  }
})
```

Pages that require login just declare `meta: { signedIn: true }` in their `<route>` block.

## SSR vs SPA

Live Change projects support both modes:

- **SSR** (default) – full server-side rendering with client hydration; recommended for production.
- **SPA** (`*:spa` scripts) – classic Single Page App mode, useful for internal tools or when SEO is not needed.

Development scripts:

| Script | Mode | DB |
|---|---|---|
| `memDev` | SPA | in-memory |
| `dev` | SPA | persistent |
| `ssrDev` | SSR + Vite | persistent |
| `serveAll` | SSR production | persistent |

The following chapters show how to build on this foundation:

- logic and data layer (`04-logic-and-data-layer`)
- forms and CRUD (`05-forms-and-auto-form`)
