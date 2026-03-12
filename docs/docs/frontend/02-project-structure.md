---
title: Frontend – Project structure
---

# Frontend – Project structure

This chapter describes the typical structure of a Live Change frontend project, using `@live-change/frontend-template` as the canonical reference.

## Top-level directories

```
my-app/
  server/                  # backend configuration
    app.config.js          # services list, clientConfig, remote settings
    services.list.js       # service module exports
    start.js               # CLI entry point (see server manual)
    init.js                # optional seed / init script
  front/                   # frontend code
    src/
      App.vue              # root component (layout, providers, global styles)
      router.js            # route definitions
      config.js            # frontend config (i18n, PrimeVue theme, locales)
      locales/             # translation files (en.js, pl.js, …)
      pages/               # file-based routed pages
      components/          # shared components (NavBar, etc.)
      analytics/           # analytics integrations
      entry-client.js      # Vite client entry
      entry-server.js      # Vite SSR entry
```

## App.vue – root component

`App.vue` wraps the whole application. The minimal pattern:

```vue
<template>
  <view-root>
    <template #navbar>
      <NavBar />
      <UpdateBanner />
    </template>
  </view-root>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import { ViewRoot, UpdateBanner } from '@live-change/frontend-base'

// Auto-form providers (needed once, globally)
import {
  provideAutoViewComponents,
  provideAutoInputConfiguration,
  provideMetadataBasedAutoInputConfiguration,
} from '@live-change/frontend-auto-form'
provideAutoViewComponents()
provideAutoInputConfiguration()
provideMetadataBasedAutoInputConfiguration()

// Head / SEO
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import { useI18n } from 'vue-i18n'
import { client as useClient, useApi } from '@live-change/vue3-ssr'
import { useRoute } from 'vue-router'
const api = useApi()
const { locale: i18nLocale } = useI18n()
const route = useRoute()

useHead(computed(() => ({
  title: api.metadata.config.value.brandName,
  htmlAttrs: {
    lang: i18nLocale.value,
    class: { 'app-dark-mode': !route.meta.lightMode }
  }
})))

// Locale sync from backend
import { useLocale } from '@live-change/vue3-components'
import { watch } from 'vue'
const locale = useLocale()
locale.captureLocale()
watch(() => locale.localeRef.value, newLocale => {
  if(newLocale?.language && i18nLocale.value !== newLocale.language) {
    i18nLocale.value = newLocale.language
  }
}, { immediate: true })
</script>

<style>
  @import "tailwindcss";
  @plugin "tailwindcss-primeui";

  @custom-variant dark (&:where(.app-dark-mode, .app-dark-mode *));

  :root {
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-family: var(--font-sans);
  }
</style>
```

Key responsibilities:

- `ViewRoot` from `frontend-base` – wraps routing and layout slots.
- `UpdateBanner` – prompts users when a new app version is deployed.
- Auto-form providers are called **once** here so every page can use `AutoField` / `AutoEditor`.
- `useHead` sets the `<html lang>` and dark-mode class reactively.
- Locale from the backend (`useLocale`) is synced to `vue-i18n`.

## config.js – frontend configuration

```javascript
import deepmerge from 'deepmerge'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

import { locales as baseLocales } from '@live-change/frontend-base'
import { locales as autoFormLocales } from '@live-change/frontend-auto-form'
import { locales as userFrontendLocales } from '@live-change/user-frontend'
// add more module locales as needed

import * as en from './locales/en.js'

export default {
  primeVue: {
    theme: {
      preset: definePreset(Aura, {
        semantic: {
          primary: { 500: '{blue.500}', /* … */ }
        }
      }),
      options: {
        prefix: 'p',
        darkModeSelector: '.app-dark-mode',
        cssLayer: { name: 'primevue', order: 'base, primevue' }
      }
    },
    ripple: true
  },

  defaultLocale: 'en',
  localeSelector: ({ headers }) => {
    const lang = headers?.['accept-language']?.split(',')[0]
    return lang?.split('-')[0] || 'en'
  },

  i18n: {
    messages: {
      en: deepmerge.all([
        baseLocales.en,
        autoFormLocales.en,
        userFrontendLocales.en,
        en.messages
      ])
    }
  }
}
```

## router.js – routing

```javascript
import { createMemoryHistory, createRouter as _createRouter, createWebHistory } from 'vue-router'
import { installRouterAnalytics } from '@live-change/vue3-components'
import { userRoutes } from '@live-change/user-frontend'
import { autoFormRoutes } from '@live-change/frontend-auto-form'
import { catchAllPagesRoute } from '@live-change/content-frontend'
import { client as useClient } from '@live-change/vue3-ssr'
import pagesRoutes from '~pages'

export function routes(config = {}) {
  const { prefix = '/' } = config
  return [
    ...userRoutes({ ...config, prefix: prefix + 'user/' }),
    ...autoFormRoutes({ ...config, prefix: prefix + 'auto-form' }),
    ...pagesRoutes,
    ...catchAllPagesRoute({ ...config }),
  ]
}

export function createRouter(app, config) {
  const client = useClient(app._context)
  const router = _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: routes(config)
  })
  installRouterAnalytics(router)
  router.beforeEach(async (to) => {
    if(typeof window === 'undefined') return
    if(to?.matched.find(m => m?.meta.signedIn) && !client.value.user) {
      localStorage.redirectAfterSignIn = JSON.stringify(to.fullPath)
      return { name: 'user:signInEmail' }
    }
  })
  return router
}
```

## Entry points

```javascript
// entry-client.js
import { clientEntry } from '@live-change/frontend-base/client-entry.js'
import App from './App.vue'
import { createRouter } from './router'
import config from './config.js'
clientEntry(App, createRouter, config)

// entry-server.js
import { serverEntry, sitemapEntry } from '@live-change/frontend-base/server-entry.js'
import App from './App.vue'
import { createRouter, sitemap as routerSitemap } from './router'
import config from './config.js'
export const render = serverEntry(App, createRouter, config)
export const sitemap = sitemapEntry(App, createRouter, routerSitemap, config)
```

## Pages – file-based routing

Pages live in `front/src/pages/` and are picked up automatically by `vite-plugin-pages` (exposed as `~pages`):

```
pages/
  index.vue                  # /
  articles/
    index.vue                # /articles
    [article]/
      index.vue              # /articles/:article
      edit.vue               # /articles/:article/edit
```

Each page optionally has a `<route>` block for metadata:

```vue
<route>
  { "name": "article:edit", "meta": { "signedIn": true } }
</route>
```

Route params come in as props:

```vue
<script setup>
const props = defineProps({
  article: { type: String, required: true }
})
</script>
```

## Shared components

Keep reusable layout pieces in `front/src/components/`:

- `NavBar.vue` – site navigation, user icon, notifications icon
- `UpdateBanner.vue` (from `frontend-base`) – version update prompt
- Domain-specific components: e.g. `ArticleCard.vue`, `UserIdentificationBanner.vue`

## Frontend module integrations

When adding a service that ships a frontend module, do two things:

**1. Merge locales in `config.js`:**

```javascript
import { locales as imageLocales } from '@live-change/image-frontend'

i18n: {
  messages: {
    en: deepmerge.all([
      // ...
      imageLocales.en,
    ])
  }
}
```

**2. Register providers in `App.vue`:**

```javascript
import { provideImageInputConfig } from '@live-change/image-frontend'
provideImageInputConfig()
```

The following chapters go deeper:

- SSR and routing (`03-ssr-and-routing`)
- Logic and data layer (`04-logic-and-data-layer`)
- Forms and CRUD with auto-form (`05-forms-and-auto-form`)
