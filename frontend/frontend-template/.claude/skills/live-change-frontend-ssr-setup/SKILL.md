---
name: live-change-frontend-ssr-setup
description: Set up SSR entry points, router, PrimeVue theme and Suspense data loading
---

# Skill: live-change-frontend-ssr-setup (Claude Code)

Use this skill to set up or adjust a **LiveChange SSR frontend**:

- client/server entry points,
- router + `meta.signedIn`,
- PrimeVue theme configuration.

## Step 1 – Client and server entry points

1. Ensure the frontend has two entry files:
   - `entry-client.js` (or `.ts`),
   - `entry-server.js` (or `.ts`).

2. Use helpers from `@live-change/frontend-base`:

```js
// entry-client.js
import { clientEntry } from '@live-change/frontend-base/client-entry.js'
import App from './App.vue'
import { createRouter } from './router.js'
import { config } from './config.js'

export default clientEntry(App, createRouter, config)
```

```js
// entry-server.js
import { serverEntry, sitemapEntry } from '@live-change/frontend-base/server-entry.js'
import App from './App.vue'
import { createRouter, routerSitemap } from './router.js'
import { config } from './config.js'

export const render = serverEntry(App, createRouter, config)
export const sitemap = sitemapEntry(App, createRouter, routerSitemap, config)
```

## Step 2 – Router and `meta.signedIn`

1. Use `vite-plugin-pages` to auto-generate routes from `src/pages/`.
2. Add a `<route>` block to each page with basic meta:

```vue
<route>
  { "name": "devices", "meta": { "signedIn": true } }
</route>
```

3. Add a navigation guard for signed-in pages:

```js
router.beforeEach((to) => {
  if(to.meta.signedIn && !isLoggedIn()) {
    localStorage.setItem('redirectAfterLogin', to.fullPath)
    return { name: 'user:signIn' }
  }
})
```

Implement `isLoggedIn()` according to the project’s auth/session model.

## Step 3 – PrimeVue theme configuration

1. In `config.js`, configure the PrimeVue theme using `definePreset`:

```js
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}'
    }
  }
})

export const config = {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: '.app-dark-mode'
    }
  }
}
```

2. Ensure the app uses this config when initializing PrimeVue (usually in `App.vue` / main entry).

## Step 4 – Global components and forms

1. In `App.vue` (or main setup), register global components used throughout the app:
   - auto-form components,
   - common layout components, etc.
2. This allows pages to use components like `<command-form>` without local imports.

## Step 5 – SSR-friendly data loading

1. Ensure the root of the app (e.g. `ViewRoot`) wraps content in `<Suspense>`.
2. In page components:
   - use `await Promise.all([live(path()....)])` inside `script setup`,
   - read from `.value` in templates,
   - **do not** fetch main data in `onMounted`.

