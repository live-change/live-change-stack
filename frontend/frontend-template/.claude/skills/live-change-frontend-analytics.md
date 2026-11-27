---
name: live-change-frontend-analytics
description: Integrate analytics tracking with analytics.emit and provider wiring
---

# Skill: live-change-frontend-analytics (Claude Code)

Use this skill when you add **analytics tracking** to a LiveChange frontend.

## When to use

- You need to track user actions, page views, or custom events.
- You are integrating PostHog, GA4, or another analytics provider.
- You need consent-aware analytics.

## Step 1 – Emit events with `analytics`

Import `analytics` from `@live-change/vue3-components` and emit events:

```javascript
import { analytics } from '@live-change/vue3-components'

// In a component or handler:
analytics.emit('article:published', { articleId: article.id })
analytics.emit('button:clicked', { action: 'delete', target: 'article' })
```

Standard built-in events:

| Event | Payload | When emitted |
|---|---|---|
| `pageView` | route `to` object | On route change (automatic in App.vue) |
| `user:identification` | `{ user, session, identification, contacts }` | When user identity is known |
| `consent` | `{ analytics: boolean }` | When user grants/denies tracking consent |
| `form` | `{ service, action, ...context }` | A real save or submit has started. Field values stay out |
| `formDone` | same payload | The command was accepted |
| `formError` | same payload plus `error` | Validation or the command failed. `error` is a property name or `unknownError` |
| `locale:change` | `{ language }` | Only when the language code changes |

## Step 2 – Wire user identification in App.vue

Emit `user:identification` when the user profile is loaded:

```javascript
import { analytics } from '@live-change/vue3-components'
import { usePath, live, useClient } from '@live-change/vue3-ssr'
import { computed, watch } from 'vue'

const client = useClient()
const path = usePath()

if(typeof window !== 'undefined') {
  Promise.all([
    live(path.userIdentification.myIdentification()),
  ]).then(([identification]) => {
    const fullIdentification = computed(() => ({
      user: client.value.user,
      session: client.value.session,
      identification: identification.value,
    }))
    watch(fullIdentification, (newId) => {
      analytics.emit('user:identification', newId)
    }, { immediate: true })
  })
}
```

## Step 3 – Create a provider file (e.g. PostHog)

Create a file like `src/analytics/posthog.js`:

```javascript
import { analytics } from '@live-change/vue3-components'
import posthog from 'posthog-js'

// Set per project. An empty key keeps the starter from sending events.
const POSTHOG_KEY = ''

function isAnalyticsGranted(value) {
  return value === true || value === 'true'
}

// contactsShared rows are { type, id }, not arrays.
function sharedContact(list, type) {
  const row = (list ?? []).find(item => item?.type === type)
  if (!row) return undefined
  return row.id || row.email || row.phone
}

function personName(record) {
  if (record?.name) return record.name
  const parts = [record?.firstName, record?.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : undefined
}

if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://eu.i.posthog.com',
    ui_host: 'https://eu.posthog.com',
    // Pending and rejected visitors are counted without a cookie. Opt-in switches to cookies.
    cookieless_mode: 'on_reject',
    opt_out_capturing_by_default: true,
    person_profiles: 'identified_only',
    capture_pageview: false
  })

  let lastIdentification = null
  let analyticsGranted = false
  let hadIdentifiedUser = false

  let lastPageviewUrl = ''

  function capturePageview() {
    const url = window.location.href
    if (url === lastPageviewUrl) return
    lastPageviewUrl = url
    posthog.capture('$pageview', { $current_url: url })
  }

  capturePageview()

  function applyIdentification() {
    if (!lastIdentification?.user) {
      if (hadIdentifiedUser) {
        posthog.reset()
        hadIdentifiedUser = false
      }
      return
    }
    if (!analyticsGranted) return
    const record = lastIdentification.identification
    posthog.identify(lastIdentification.user, {
      user: lastIdentification.user,
      email: sharedContact(record?.contactsShared, 'email')
        || (lastIdentification.contacts ?? []).find(c => c.contactType === 'email')?.email,
      phone: sharedContact(record?.contactsShared, 'phone')
        || (lastIdentification.contacts ?? []).find(c => c.contactType === 'phone')?.phone,
      firstName: record?.firstName,
      lastName: record?.lastName,
      name: personName(record),
      title: record?.title
    })
    hadIdentifiedUser = true
  }

  analytics.on('consent', (payload) => {
    analyticsGranted = isAnalyticsGranted(payload?.analytics)
    if (analyticsGranted) {
      posthog.opt_in_capturing()
      applyIdentification()
    } else {
      posthog.opt_out_capturing()
    }
  })

  analytics.on('user:identification', (identification) => {
    lastIdentification = identification
    applyIdentification()
  })

  analytics.on('pageView', (to) => {
    posthog.register({
      route: { name: to.name, params: to.params }
    })
    capturePageview()
  })

  analytics.on('locale', (record) => {
    const language = record?.language
    if (!language) return
    posthog.register({ language })
  })

  const ignored = ['user:identification', 'pageView', 'consent', 'locale']
  analytics.on('*', (type, event) => {
    if (ignored.includes(type)) return
    posthog.capture(type, event)
  })
}
```

Import it from `src/analytics/index.js` (`App.vue` already imports `./analytics`):

```javascript
import './posthog.js'
```

## Step 4 – Emit custom events in components

```javascript
// Track a form submission
analytics.emit('form:submitted', { formName: 'contactForm' })

// Track a feature usage
analytics.emit('feature:used', { feature: 'darkMode', enabled: true })

// Track navigation
analytics.emit('navigation:click', { target: 'pricing', source: 'navbar' })
```

## Saves

`editorData` and `actionData` emit `form` before the model or action command, then `formDone` or `formError`. Draft autosave is not a save attempt. Pass `analyticsContext` as an object or a function; it is read when the event is sent. `service` and `action` from the command win over context. Do not put field values, email, or secrets in the context.

Manual commands use `trackForm` from `@live-change/vue3-components`:

```javascript
import { trackForm } from '@live-change/vue3-components'

await trackForm({
  service: 'profile',
  action: 'setMyUserIntent',
  context: () => ({ place: 'onboarding', field: 'intent' })
}, () => api.command(['profile', 'setMyUserIntent'], { keys }))
```

`<command-form>` still emits the same three names and keeps `parameters` in the payload.

## Step 5 – Consent handling

Emit consent events from your consent banner:

```javascript
function acceptAnalytics() {
  analytics.emit('consent', { analytics: true })
}

function rejectAnalytics() {
  analytics.emit('consent', { analytics: false })
}
```

Provider files listen for `consent`. PostHog stays cookieless until the value is `true` or `'true'`, then opts in and identifies. Any other value opts out and does not identify.

Emit `locale` whenever a language is known, including the first render, and keep it out of the catch-all. Providers store it as a property. Emit `locale:change` only when the language code actually changes, with `{ language }` and nothing else from the locale record.
