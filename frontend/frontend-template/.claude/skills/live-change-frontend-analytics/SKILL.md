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
| `locale:change` | locale settings object | When language/locale changes |

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

posthog.init('phc_YOUR_KEY', {
  api_host: 'https://eu.i.posthog.com',
  person_profiles: 'always'
})

// Page views
analytics.on('pageView', (to) => {
  posthog.register({
    route: { name: to.name, params: to.params }
  })
})

// User identification
analytics.on('user:identification', (identification) => {
  if (!identification.user) {
    posthog.reset()
    return
  }
  posthog.identify(identification.user, {
    firstName: identification.identification?.firstName,
    lastName: identification.identification?.lastName,
  })
})

// Consent
analytics.on('consent', (payload) => {
  if (payload?.analytics === true) {
    posthog.opt_in_capturing()
  } else {
    posthog.opt_out_capturing()
  }
})

// Catch-all for custom events
const ignored = ['user:identification', 'pageView', 'consent']
analytics.on('*', (type, event) => {
  if (ignored.includes(type)) return
  posthog.capture(type, event)
})
```

Import it in `App.vue`:

```javascript
import './analytics/posthog'
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

Provider files listen for `consent` and enable/disable tracking accordingly.
