---
title: Frontend – UI and components
---

# Frontend – UI and components

This chapter describes how to combine:

- logic and form components (`@live-change/vue3-components`, `@live-change/frontend-auto-form`)
- the UI system (PrimeVue, Tailwind)
- app-specific layouts (`App.vue`, `NavBar`, banners)

## PrimeVue and Tailwind

Tailwind and PrimeVue are configured together in two places:

**`App.vue` `<style>` section** – imports Tailwind and the PrimeUI plugin:

```css
<style>
  @import "tailwindcss";
  @plugin "tailwindcss-primeui";

  /* Dark mode variant driven by a class on <html> */
  @custom-variant dark (&:where(.app-dark-mode, .app-dark-mode *));

  :root {
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-family: var(--font-sans);
  }
</style>
```

**`front/src/config.js`** – PrimeVue theme and dark mode selector:

```javascript
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

export default {
  primeVue: {
    theme: {
      preset: definePreset(Aura, {
        semantic: {
          primary: { /* your brand colours */ }
        }
      }),
      options: {
        prefix: 'p',
        darkModeSelector: '.app-dark-mode',
        cssLayer: {
          name: 'primevue',
          order: 'base, primevue',
        },
      }
    },
    ripple: true
  }
}
```

The `darkModeSelector: '.app-dark-mode'` matches the class added to `<html>` by `useHead` in `App.vue`. Change the theme preset once here; every PrimeVue component picks it up automatically.

## Global layout – App.vue

`App.vue`:

- uses `ViewRoot` and `UpdateBanner` from `frontend-base`,
- contains the navigation bar, consent / identification banners, and portals,
- configures global styles (Tailwind, typography, links).

The key idea:

- keep the **global layout** in `App.vue`,
- keep **domain logic and forms** in page components (`pages/*`) and feature components (`components/*`).

## Combining AutoField with UI components

The most common pattern is to pair `AutoField` (form logic, validation, label/error) with a specific PrimeVue component in the `#default` slot:

```vue
<!-- Dropdown replacing the default input -->
<AutoField :definition="definition.properties.category" v-model="editable.category"
           class="mb-3" :label="t('article.category')">
  <template #default>
    <Select v-model="editable.category"
            :options="definition.properties.category.options"
            :optionLabel="v => t('article.categories.' + v)"
            size="small"
            class="w-full" />
  </template>
</AutoField>
```

```vue
<!-- Slider replacing the default numeric input -->
<AutoField :definition="definition.properties.depth" v-model="editable.depth"
           class="mb-3" :label="t('settings.depth')">
  <template #default>
    <Slider v-model="editable.depth" :min="1" :max="10" class="w-full" />
  </template>
</AutoField>
```

`AutoField` handles:

- labels and errors (slots `#label`, `#error`),
- validation state based on the server definition.

## NavBar pattern

A typical navbar uses `UserIcon` and `NotificationsIcon` from `user-frontend`, and `client` from `vue3-ssr` to conditionally show sign-in/sign-up links:

```vue
<template>
  <div class="bg-surface-0 dark:bg-surface-900 py-1 px-6 shadow flex items-center
              sticky top-0 z-20" style="min-height: 80px">
    <router-link to="/" class="no-underline mr-6">
      <span class="text-2xl font-medium text-surface-800 dark:text-surface-50">MyApp</span>
    </router-link>

    <div class="flex-1" />

    <router-link v-if="!client.user" :to="{ name: 'user:signInEmail' }"
                 class="mr-4 no-underline text-surface-600 hover:text-surface-900">
      Sign in
    </router-link>
    <router-link v-if="!client.user" :to="{ name: 'user:signUpEmail' }"
                 class="no-underline text-surface-600 hover:text-surface-900">
      Sign up
    </router-link>

    <NotificationsIcon v-if="client.user" />
    <UserIcon v-if="client.user" />
  </div>
</template>

<script setup>
import { NotificationsIcon, UserIcon } from '@live-change/user-frontend'
import { client as useClient } from '@live-change/vue3-ssr'
const client = useClient()
</script>
```

## Domain-specific components

Projects define domain-specific components that combine:

- domain logic (loading data, computing derived state)
- `AutoField` + PrimeVue widgets
- observations from `vue3-ssr` and `vue3-components`

Recommended pattern:

1. Keep data logic in composables / script setup.
2. Use `AutoField` and UI components in the template.
3. Avoid duplicating field definitions – always reuse model/action definitions from the server via `useApi()`.
