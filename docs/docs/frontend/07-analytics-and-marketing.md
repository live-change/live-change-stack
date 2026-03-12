---
title: Frontend – Analytics and marketing
---

# Frontend – Analytics and marketing

This chapter describes patterns for:

- analytics integration (GA4, Clarity, PostHog, custom events)
- consent and preference banners
- marketing pages and print views

## Analytics integration

In `front/src/analytics/index.js` (or a `beforeStart` config hook) initialise the analytics tools from `clientConfig`:

```javascript
import { analytics } from '@live-change/vue3-components'

export function initAnalytics(api) {
  if(typeof window === 'undefined') return

  const { ga4MeasurementId, clarityMeasurementId } = api.metadata.config.value

  if(ga4MeasurementId) {
    // initialise GA4 here
  }
  if(clarityMeasurementId) {
    // initialise Clarity here
  }
}
```

Settings like `ga4MeasurementId` come from `clientConfig` defined in `server/app.config.js`.

Import the initialiser from `App.vue`:

```javascript
import './analytics'
```

## Consent and banners

For GDPR-compliant consent management use the `agreement` service. In `App.vue`:

```vue
<script setup>
import { computed, watch } from 'vue'
import { usePath, live, useActions } from '@live-change/vue3-ssr'
import { analytics } from '@live-change/vue3-components'

const path = usePath()
const actions = useActions()

const [ agreement ] = await Promise.all([
  live(path.agreement.myAgreement())
])

// Forward consent state to analytics on every change
const consentPayload = computed(() => ({
  analytics: agreement.value === undefined
    ? false
    : !!agreement.value?.analytics
}))

watch(consentPayload, state => {
  if(typeof window !== 'undefined') {
    analytics.emit('consent', state)
  }
}, { immediate: true })

async function acceptAnalytics() {
  await actions.agreement.setOrUpdateMyAgreement({ analytics: true })
  analytics.emit('consent', { analytics: true })
}

async function rejectAnalytics() {
  await actions.agreement.setOrUpdateMyAgreement({ analytics: false })
  analytics.emit('consent', { analytics: false })
}
</script>

<template>
  <view-root>
    <template #navbar>
      <NavBar />
    </template>

    <!-- Analytics consent banner -->
    <div v-if="agreement.value === null"
         class="fixed bottom-0 left-0 right-0 p-4 bg-surface-0 dark:bg-surface-900 shadow-lg
                flex items-center justify-between">
      <span>We use analytics cookies to improve this site.</span>
      <div class="flex gap-2">
        <Button label="Accept" @click="acceptAnalytics" />
        <Button label="Reject" severity="secondary" @click="rejectAnalytics" />
      </div>
    </div>
  </view-root>
</template>
```

Flow:

1. On startup `agreement.myAgreement` is loaded reactively.
2. The banner is shown when `agreement.value === null` (consent not yet given).
3. Clicking **Accept / Reject** calls the action and emits `consent` to analytics.

## Analytics and user identification

After login, send a `user:identification` event so analytics tools can associate events with a user:

```javascript
import { computed, watch } from 'vue'
import { client as useClient, usePath, live } from '@live-change/vue3-ssr'
import { analytics } from '@live-change/vue3-components'

const client = useClient()
const path = usePath()

const identificationPath = computed(() =>
  client.value.user ? path.userIdentification.myIdentification() : null
)
const [ identification ] = await Promise.all([
  live(identificationPath)
])

watch([client, identification], ([newClient, newIdentification]) => {
  if(typeof window === 'undefined') return
  if(!newClient.user) return
  analytics.emit('user:identification', {
    userId: newClient.user,
    name: [newIdentification?.firstName, newIdentification?.lastName].filter(Boolean).join(' '),
  })
}, { immediate: true })
```

## Print views

For pages that should render differently when printed (e.g. PDF export, printable layouts), create a dedicated nested route:

```
pages/
  articles/
    [article]/
      _print/
        index.vue   # print layout, no navbar/footer
```

The print page:

- uses the same model data as the regular view,
- omits navigation components,
- may apply print-specific styles (`@media print { … }` or a dedicated layout component).

## Recipes

**Consent banner** checklist:

1. Use the `agreement` service on the server.
2. Load `myAgreement` with `live(path.agreement.myAgreement())`.
3. Show a banner when `agreement.value === null`.
4. On accept/reject call `actions.agreement.setOrUpdateMyAgreement`.
5. Emit `analytics.emit('consent', { analytics: true/false })` after each change.

**User identification for analytics:**

1. Load `userIdentification.myIdentification` after login.
2. Emit `user:identification` with name, user id, and any extra properties.

**Print views:**

1. Create a `_print/` subfolder under the relevant page directory.
2. Use the same service views but a minimal layout.
3. Trigger via `router.push({ name: 'article:print', params: { article: id } })` or `window.print()`.
