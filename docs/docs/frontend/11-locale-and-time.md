---
title: Locale and Time
---

# Locale and Time

Live Change applications handle locale (language, timezone, number formats) and real-time clocks in a consistent way across pages, forms, and email templates. This chapter covers the key utilities and patterns.

## Locale

### useLocale()

`useLocale()` from `@live-change/vue3-components` returns a `Locale` instance that is shared per app context (singleton). It reads the user's locale preferences from the `localeSettings` service and provides reactive computed values.

```javascript
import { useLocale } from '@live-change/vue3-components'
const locale = useLocale()
```

**Reactive properties:**

| Property | Type | Description |
|---|---|---|
| `localeRef` | `Ref` | Raw locale settings object |
| `language` | `ComputedRef<string>` | BCP 47 language tag (e.g. `"pl"`, `"en-US"`) |
| `currency` | `ComputedRef<string>` | ISO currency code (e.g. `"usd"`) |
| `dateTime` | `ComputedRef<object>` | `Intl.DateTimeFormat` resolved options (incl. `timeZone`) |
| `timezoneOffset` | `ComputedRef<number>` | Offset in minutes between user timezone and server timezone |

**Methods:**

| Method | Description |
|---|---|
| `getLocale()` | Returns a Promise resolving to the current locale settings |
| `getLanguage()` | Returns 2-letter language code or `null` |
| `captureLocale()` | Reads browser `Intl.*` APIs and saves them to the backend (call once in `App.vue`) |
| `updateLocale(update)` | Saves locale settings update via `localeSettings.setOrUpdateMyLocaleSettings` |
| `watchLocale(callback)` | Watches locale changes; unobserves on component unmount |
| `localTime(date)` | Converts a server-side `Date` to user's timezone (only meaningful during SSR) |

### Capturing locale in App.vue

On startup, call `captureLocale()` once to save the browser's detected language and Intl settings to the backend. This runs only on the client.

```javascript
// App.vue
import { useLocale } from '@live-change/vue3-components'
const locale = useLocale()
locale.captureLocale()
```

### Syncing locale with vue-i18n

The locale stored in the backend drives vue-i18n's active language. Watch for changes and update the i18n locale:

```javascript
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@live-change/vue3-components'

const { locale: i18nLocale } = useI18n()
const locale = useLocale()

// Force locale observable to start
locale.getLocaleObservable()

watch(() => locale.localeRef.value, (newLocale) => {
  if (newLocale?.language && i18nLocale.value !== newLocale.language) {
    i18nLocale.value = newLocale.language
  }
}, { immediate: true })
```

### Letting users change language

Use a `command-form` bound to `localeSettings.setOrUpdateMyLocaleSettings`. The available locales come from vue-i18n `availableLocales`:

```vue
<template>
  <command-form service="localeSettings" action="setOrUpdateMyLocaleSettings"
                :initialValues="{ language: localeSettings.language }"
                v-slot="{ data }" keepOnDone @done="handleDone">
    <Dropdown v-model="data.language"
              :options="availableLocales"
              :optionLabel="l => getLocaleMessage(l)?.languageName ?? l"
              showClear
              :placeholder="t('settings.autoDetect')" />
    <Button type="submit" :label="t('settings.apply')" icon="pi pi-save" />
  </command-form>
</template>

<script setup>
  import { usePath, live } from '@live-change/vue3-ssr'
  import { useI18n } from 'vue-i18n'

  const { t, availableLocales, getLocaleMessage } = useI18n()
  const path = usePath()
  const [localeSettings] = await Promise.all([
    live(path.localeSettings.myLocaleSettings({}))
  ])
  function handleDone() {
    toast.add({ severity: 'success', summary: t('settings.localeSettingsSaved') })
  }
</script>
```

### Displaying dates in user timezone

Use vue-i18n's `d()` function for date formatting and `locale.localTime()` to convert server timestamps to the user's timezone. This is important during SSR where the server runs in a different timezone.

```vue
<template>
  <span>{{ d(locale.localTime(new Date(event.startsAt)), 'long') }}</span>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  import { useLocale } from '@live-change/vue3-components'

  const { d } = useI18n()
  const locale = useLocale()
</script>
```

`locale.localTime(date)` applies the timezone offset only during SSR. On the client the date is returned unchanged, since the browser already handles the user's local timezone in `Intl.DateTimeFormat`.

---

## Time utilities

### currentTime, realTime, now

Exported from `@live-change/frontend-base`:

```javascript
import { currentTime, realTime, now } from '@live-change/frontend-base'
```

| Export | Type | Description |
|---|---|---|
| `currentTime` | `Ref<number>` | Current timestamp in ms. Starts as `NaN` (SSR), set to server time on hydration, then ticks every 500ms after `startRealTime()` |
| `realTime` | `Ref<boolean>` | `true` once real-time ticking is active |
| `now()` | `function` | Returns `Date.now()` in real-time mode, or `currentTime.value` otherwise |

**Lifecycle:**

1. During SSR the server renders a page and embeds `window.__NOW__` with the server timestamp.
2. On client hydration `setTime(window.__NOW__)` is called – `currentTime` is set to the server value so SSR and client HTML match.
3. After mounting, `startRealTime()` is called – `realTime` becomes `true` and `currentTime` starts ticking every 500ms.

You do not call these functions yourself; `client-entry.js` handles the lifecycle automatically.

**Using `currentTime` in a component:**

```vue
<template>
  <span>{{ formattedTime }}</span>
</template>

<script setup>
  import { computed } from 'vue'
  import { currentTime } from '@live-change/frontend-base'
  import { useI18n } from 'vue-i18n'
  const { d } = useI18n()

  const formattedTime = computed(() =>
    isNaN(currentTime.value) ? '' : d(new Date(currentTime.value), 'time')
  )
</script>
```

Because `currentTime` is a global `ref`, any component that reads it re-renders automatically every 500ms.

### useTimeSynchronization()

When the server and client clocks differ (clock skew), `useTimeSynchronization()` from `@live-change/vue3-ssr` provides a reactive diff so you can convert between server timestamps and local time.

```javascript
import { useTimeSynchronization } from '@live-change/vue3-ssr'
const timeSync = useTimeSynchronization()
```

**Returned object:**

| Property | Type | Description |
|---|---|---|
| `diff` | `ComputedRef<number>` | `serverTime - clientTime` offset in ms |
| `synchronized` | `ComputedRef<boolean>` | `true` once sync is complete |
| `waitForSynchronized()` | `function` | Promise that resolves when sync is done |
| `serverToLocal(ts)` | `function` | Convert server timestamp to local time |
| `localToServer(ts)` | `function` | Convert local timestamp to server time |
| `serverToLocalComputed(ts)` | `function` | Reactive computed version of `serverToLocal` |
| `localToServerComputed(ts)` | `function` | Reactive computed version of `localToServer` |

On the server side all functions are identity functions (diff = 0).

**Example – displaying a server-side deadline as local time:**

```javascript
import { useTimeSynchronization } from '@live-change/vue3-ssr'
const timeSync = useTimeSynchronization()

// article.deadline is a server timestamp
const localDeadline = timeSync.serverToLocalComputed(
  computed(() => article.value?.deadline)
)
```

Enable time synchronization in the client config:

```javascript
// config.js
export default {
  timeSynchronization: true,
  // ...
}
```

---

## Locale in email templates

Email templates are Vue components rendered server-side via SSR for each recipient. They do **not** use the reactive locale store – instead they explicitly fetch the locale for the specific user/session the email is being sent to.

### Pattern

```vue
<script setup>
  import { useI18n } from 'vue-i18n'
  import { useLocale } from '@live-change/vue3-components'
  import { useApi } from '@live-change/vue3-ssr'

  const { locale: i18nLocale, t } = useI18n()
  const locale = useLocale()
  const api = useApi()

  // props contain the target user/session from the email trigger
  const { json } = defineProps({ json: { type: String, required: true } })
  const data = JSON.parse(json)

  // Fetch locale for the recipient, not the current session
  await Promise.all([
    locale.getOtherUserOrSessionLocale(data.user, data.client?.session)
  ])

  // Apply detected language to vue-i18n
  if (locale.getLanguage()) i18nLocale.value = locale.getLanguage()
</script>
```

### Key differences from regular pages

| Aspect | Regular page | Email template |
|---|---|---|
| Locale source | `locale.getLocale()` (current user's session) | `locale.getOtherUserOrSessionLocale(user, session)` |
| Language sync | `watch(locale.localeRef, ...)` in `App.vue` | Direct assignment after `await` |
| Time conversion | `locale.localTime()` only on server, client handles it | Always server-side; use `locale.localTime()` for all dates |
| Reactive updates | Yes | No (one-shot SSR render) |

### Email metadata

Email templates include a `<pre data-headers>` block with JSON metadata (from, to, subject). The subject uses `t()` so it is already translated to the recipient's language:

```vue
<template>
  <pre data-headers>{{ JSON.stringify(metadata, null, '  ') }}</pre>
  <div data-html class="message">
    <!-- HTML email body -->
  </div>
  <pre data-text>
    <!-- Plain-text fallback -->
  </pre>
</template>

<script setup>
  const metadata = {
    from: `${brandName} <admin@${brandDomain}>`,
    subject: t('emailTemplates.welcome.subject'),
    to: contact
  }
</script>
```

The email renderer extracts `data-headers` (JSON), `data-html` (HTML body), and `data-text` (plain-text body) from the rendered output.

### Using brand config in emails

Brand name, domain, and base URL are available via `api.metadata.config`:

```javascript
import { useApi } from '@live-change/vue3-ssr'
const api = useApi()

const { brandName, brandDomain, baseHref } = api.metadata.config.value
```

Use `baseHref` with the router to build absolute links:

```javascript
import { useRouter } from 'vue-router'
const router = useRouter()

const confirmLink = baseHref + router.resolve({
  name: 'user:link',
  params: { secretCode: secret.secretCode }
}).href
```
