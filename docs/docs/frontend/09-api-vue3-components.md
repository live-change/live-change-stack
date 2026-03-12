---
title: API – @live-change/vue3-components
---

# API – @live-change/vue3-components

This chapter is a concise API reference for the most commonly used parts of `@live-change/vue3-components`. Implementation details are in the package source.

## registerComponents(app, settings?)

Registers components globally:

- logic (`logic/*`)
- forms (`form/*`)
- views (`view/*`)

```javascript
import { createApp } from 'vue'
import { registerComponents } from '@live-change/vue3-components'

const app = createApp(App)
registerComponents(app, {
  // optional settings, e.g. analytics
})
```

## Loading and working zones

### WorkingZone

Component that tracks in-progress async operations (commands/mutations) and exposes their state via slots and provide/inject.

`ViewRoot` already wraps every page in a `WorkingZone`, so the global spinner + blur is handled automatically. Use `WorkingZone` directly only when you need a **local** indicator for a specific section.

**Provided injection key:** `workingZone`

```javascript
const workingZone = inject('workingZone')
```

**Key method:**

```javascript
workingZone.addPromise(name: string, promise: Promise): Promise
```

Registers `promise` under `name`. While pending the `#working` slot is shown. Returns the same promise so you can chain on it.

**Slots:**

| Slot | When | Props |
|---|---|---|
| `#default` | always | `{ isWorking: boolean, working: Task[] }` |
| `#working` | while any promise is pending | – |
| `#error` | on failure | `{ errors }` |

**Template example:**

```vue
<working-zone>
  <template #working>
    <ProgressSpinner animationDuration=".5s" />
  </template>
  <template #default="{ isWorking }">
    <div :class="{ 'opacity-50 pointer-events-none': isWorking }">
      <!-- content -->
    </div>
  </template>
</working-zone>
```

### LoadingZone

Component that tracks Suspense-based async loading and exposes its state.

`ViewRoot` also wraps every page in a `LoadingZone` (with `suspense` prop), so page-level loading is handled automatically.

Props:

- `suspense` (boolean, default `false`) – wraps children in `<Suspense>` when true

**Provided injection key:** `loadingZone`

Slots: same structure as `WorkingZone` but named `#loading`.

### LoadingWorkingZone

Combines `LoadingZone` + `WorkingZone` into one component. Use for sub-sections that need both Suspense loading and command feedback.

Props: `suspense` (same as `LoadingZone`).

Slots: `#default`, `#loading`, `#working`, `#error`.

## Forms

### DefinedForm

Renders a form from a definition (model or action).

Props:

- `definition` – model/action definition
- `modelValue` – form data

Events:

- `update:modelValue`
- `submit`

### CommandForm

Similar to `DefinedForm`, but wired directly to an action (command).

Props:

- `definition`
- `modelValue`
- `serviceName`, `actionName` (or other command parameters)

### FormBind

Lower-level: for manually binding definition, validation and data.

## synchronized(options)

Creates editable data from a `source` and an `update` action.

Options:

- `source` – `Ref` / `computed` with source data
- `update` – action function (e.g. `actions.blog.updateArticle`)
- `identifiers` – identifier object (e.g. `{ event }`)
- `updateDataProperty` – property name when data is nested (e.g. `data`)
- `recursive` – deep change tracking
- `autoSave` – save automatically on change
- `debounce` – auto-save delay in ms
- `onSave` – callback after save

Returns an object containing:

- `value` – `Ref` to the editable data
- `changed` – `Ref` (boolean), whether there are unsaved changes
- `saving` – `Ref` (boolean), whether a save is in progress
- `save()` – manual save trigger

## analytics

`analytics` is a simple event emitter:

- `analytics.emit(name, payload)` – send an event

You typically wire GA4 / Clarity / PostHog integrations to it in one place.

## useLocale()

Hook for user locale:

- `localeRef` – currently selected language
- methods to get/set locale

In projects it is synced with `vue-i18n` and analytics (`locale:change`).
