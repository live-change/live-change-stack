---
name: live-change-frontend-locale-time
description: Handle locale, timezone, currentTime, time synchronization and email locale
---

# Skill: live-change-frontend-locale-time (Claude Code)

Use this skill when you work with **locale, language, time, and timezone** in a LiveChange frontend.

## When to use

- You need to display dates/times in the user's timezone.
- You are building a time-sensitive feature (countdown, deadline, scheduling).
- You need to sync locale with vue-i18n.
- You are writing an email template that must use the recipient's language.

## Step 1 – Set up locale in App.vue

```javascript
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@live-change/vue3-components'

const { locale: i18nLocale } = useI18n()
const locale = useLocale()

// Capture browser locale settings and save to backend
locale.captureLocale()

// Watch for locale changes and sync with vue-i18n
locale.getLocaleObservable()
watch(() => locale.localeRef.value, (newLocale) => {
  if (newLocale?.language && i18nLocale.value !== newLocale.language) {
    i18nLocale.value = newLocale.language
  }
}, { immediate: true })
```

## Step 2 – Display dates in user timezone

Use vue-i18n's `d()` function for formatting and `locale.localTime()` for SSR timezone conversion:

```vue
<template>
  <span>{{ d(locale.localTime(new Date(article.createdAt)), 'long') }}</span>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  import { useLocale } from '@live-change/vue3-components'

  const { d } = useI18n()
  const locale = useLocale()
</script>
```

`locale.localTime(date)` converts server timestamps to the user's timezone during SSR. On the client (browser), it returns the date unchanged since the browser handles timezone natively.

## Step 3 – Use `currentTime` for reactive clocks

`currentTime` is a global `Ref<number>` that ticks every 500ms:

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

Any component reading `currentTime` re-renders automatically every 500ms.

## Step 4 – Correct clock skew with `useTimeSynchronization`

When the client clock differs from the server clock (important for real-time features like quizzes, countdowns, auctions):

```javascript
import { useTimeSynchronization } from '@live-change/vue3-ssr'
import { currentTime } from '@live-change/frontend-base'

const timeSync = useTimeSynchronization()

// Convert client time to server time (reactive computed)
const serverTime = timeSync.localToServerComputed(currentTime)

// Countdown to a server-side deadline
const timeRemaining = computed(() => deadline.value - serverTime.value)
const seconds = computed(() => Math.max(0, Math.floor(timeRemaining.value / 1000) % 60))
const minutes = computed(() => Math.max(0, Math.floor(timeRemaining.value / 1000 / 60)))
```

Enable time synchronization in `config.js`:

```javascript
export default {
  timeSynchronization: true,
  // ...
}
```

**When to use:** Only when clock skew matters – real-time events, countdown timers, time-limited actions. For simple date display, `currentTime` alone is sufficient.

### Returned object from `useTimeSynchronization()`:

| Property | Description |
|---|---|
| `diff` | Server-client time offset in ms |
| `synchronized` | `true` once sync is complete |
| `serverToLocal(ts)` | Convert server timestamp to local |
| `localToServer(ts)` | Convert local timestamp to server |
| `serverToLocalComputed(ts)` | Reactive computed version |
| `localToServerComputed(ts)` | Reactive computed version |

## Step 5 – Smooth countdown with requestAnimationFrame

For sub-500ms precision (e.g. animated countdown knobs):

```javascript
import { ref } from 'vue'
import { useRafFn } from '@vueuse/core'
import { useTimeSynchronization } from '@live-change/vue3-ssr'

const rafNow = ref(Date.now())
useRafFn(() => { rafNow.value = Date.now() })

const timeSync = useTimeSynchronization()
const rafServerTime = timeSync.localToServerComputed(rafNow)

const countdown = computed(() =>
  Math.max(0, deadline.value - rafServerTime.value)
)
```

## Step 6 – Locale in email templates

Email templates render server-side. They fetch the recipient's locale explicitly:

```javascript
import { useI18n } from 'vue-i18n'
import { useLocale } from '@live-change/vue3-components'

const { locale: i18nLocale, t } = useI18n()
const locale = useLocale()

// props.json contains { user, client: { session } }
const data = JSON.parse(json)

// Fetch locale for the recipient (not current session)
await Promise.all([
  locale.getOtherUserOrSessionLocale(data.user, data.client?.session)
])

// Apply to vue-i18n
if (locale.getLanguage()) i18nLocale.value = locale.getLanguage()
```

Key differences from regular pages:

| Aspect | Regular page | Email template |
|---|---|---|
| Locale source | `locale.getLocale()` (current user) | `locale.getOtherUserOrSessionLocale(user, session)` |
| Time conversion | `locale.localTime()` only on SSR | Always server-side |
| Reactive updates | Yes | No (one-shot SSR render) |
