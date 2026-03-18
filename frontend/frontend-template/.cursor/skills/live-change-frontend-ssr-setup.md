---
name: live-change-frontend-ssr-setup
description: Set up SSR entry points, router, PrimeVue theme and Suspense data loading
---

# Skill: live-change-frontend-ssr-setup

Ten skill opisuje **konfigurację frontendu** opartego o live-change-stack:

- entry-client / entry-server,
- router i meta `signedIn`,
- konfigurację PrimeVue / motywu.

## 1. Entry points – klient i serwer

1. W projekcie frontendowym upewnij się, że masz dwa entry points:
   - `entry-client.js` (lub `.ts`),
   - `entry-server.js` (lub `.ts`).

2. Skorzystaj z helperów z `@live-change/frontend-base`:

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

## 2. Router – `vite-plugin-pages` + meta `signedIn`

1. Użyj `vite-plugin-pages` do generowania tras z `src/pages/`.
2. Dodaj blok `<route>` w plikach stron, np.:

```vue
<route>
  { "name": "devices", "meta": { "signedIn": true } }
</route>
```

3. W routerze dodaj guard logowania (jeśli go nie ma):

```js
router.beforeEach((to) => {
  if(to.meta.signedIn && !isLoggedIn()) {
    localStorage.setItem('redirectAfterLogin', to.fullPath)
    return { name: 'user:signIn' }
  }
})
```

Funkcja `isLoggedIn()` może opierać się na stanie sesji/usera w store lub prostym sprawdzeniu tokena/ciasteczek.

## 3. Konfiguracja PrimeVue – motyw i opcje

1. W pliku `config.js` skonfiguruj PrimeVue:

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

2. Upewnij się, że App.vue używa tego configu przez globalną konfigurację PrimeVue (zgodnie z template’em live-change-stack).

## 4. Globalne komponenty i formularze

1. W `App.vue` zarejestruj globalne komponenty używane często w projekcie:
   - auto-form components,
   - globalne layouty, jeśli są.

2. Dzięki temu na stronach używasz np. `<command-form>` bez lokalnego importu.

## 5. SSR i `live/path` + Suspense

1. Upewnij się, że root aplikacji (np. `ViewRoot`) opakowuje strony w `<Suspense>`.
2. Strony powinny:
   - używać `await Promise.all([live(path()....)])` w `script setup`,
   - korzystać z `.value` w template,
   - nie wykonywać pobierania danych w `onMounted`.

