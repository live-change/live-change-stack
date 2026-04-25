---
name: live-change-frontend-data-views
description: Build reactive data views with usePath, live, .with() and useClient auth guards
---

# Skill: live-change-frontend-data-views (Claude Code)

Use this skill when you build **reactive data views** using `usePath`, `live`, `.with()`, and `useClient` in a LiveChange frontend.

## When to use

- You are loading data from backend views.
- Paths depend on reactive values (route params, props, client state).
- You need to load related objects alongside the main data.
- You need to restrict data loading for unauthenticated users.

**Do not use `api.command` / `useActions()` to load data.** Commands are for **mutations**. For every read (lists, details, previews, “next number”), use **views** with `live` or `useFetch` as in this skill.

## Step 1 – Basic data loading with computed paths

When paths depend on reactive values (route params, props), wrap them in `computed()`:

```javascript
import { computed, unref } from 'vue'
import { usePath, live } from '@live-change/vue3-ssr'
import { useRoute } from 'vue-router'

const path = usePath()
const route = useRoute()
const articleId = route.params.article

const articlePath = computed(() => path.blog.article({ article: unref(articleId) }))
const commentsPath = computed(() => path.blog.articleComments({ article: unref(articleId) }))

const [article, comments] = await Promise.all([
  live(articlePath),
  live(commentsPath),
])
```

- Call `usePath()` **once** at the top of `setup` (synchronously). Inside `computed`, use only the returned `path` object to build paths — **never** call `usePath()` or the legacy `path()` inside the getter (there is often no active component instance, which breaks `getCurrentInstance()` / `appContext`).

Wrong:

```javascript
computed(() => usePath().blog.article({ article: id }))
```

Right:

```javascript
const path = usePath()
const articlePath = computed(() => path.blog.article({ article: id }))
```

In templates access `.value`:

```vue
<h1>{{ article.value?.title }}</h1>
<div v-for="comment in comments.value" :key="comment.id">
  {{ comment.text }}
</div>
```

## Step 2 – One-time fetches with `useFetch`

When you need data once (e.g. after an upload, in an event handler), use `useFetch` instead of `live`:

```javascript
import { usePath, useFetch } from '@live-change/vue3-ssr'

const path = usePath()
const data = await useFetch(path.paperInvoice.invoiceFileInfo({ invoiceFile: fileId }))
```

**Do NOT use `api.get()` with Path objects.** `path.service.view()` returns a Path object (with `.what`, `.more`, `.to` properties), not a raw array. `api.get()` only accepts raw arrays like `['service', 'view', { params }]`.

| Method | Input | Returns | Use when |
|---|---|---|---|
| `live(path)` | Path or array | Reactive Ref | Live-updating data |
| `useFetch(path)` | Path or array | Promise | One-time fetch |
| `api.get([...])` | Raw array only | Promise | Low-level, avoid in app code |

## Step 3 – Load related objects with `.with()`

Chain `.with()` to attach related data to each item:

```javascript
const articlesPath = computed(() =>
  path.blog.articlesByCreatedAt({ limit: 20 })
    .with(article => path.userIdentification.identification({
      sessionOrUserType: article.authorType,
      sessionOrUser: article.author
    }).bind('authorProfile'))
    .with(article => path.blog.articleCategory({ category: article.category }).bind('categoryData'))
)

const [articles] = await Promise.all([live(articlesPath)])
```

### `.with()` callback guardrails

Treat `.with(item => ...)` as a declarative Path DSL builder:

- the callback receives a proxy, not a hydrated runtime record
- do not place side effects or command calls inside `.with(...)`
- do not use imperative branching like `if(item.type === '...')` in the callback

Use `$switch` for conditional path branching:

```javascript
const settlementsPath = computed(() =>
  path.accounting.settlementsByTransaction({
    transactionType: 'bankAccount_BankTransaction',
    transaction: transactionId,
    range: { limit: 256 }
  }).with(settlement => settlement.subjectType.$switch({
    invoice_CostInvoice: path.invoice.costInvoice({ costInvoice: settlement.subject }),
    invoice_IncomeInvoice: path.invoice.incomeInvoice({ incomeInvoice: settlement.subject }),
    hr_CivilContract: path.hr.civilContract({ civilContract: settlement.subject })
  }).$bind('subjectDoc'))
)
```

Production-style pattern reference:

```javascript
p.url.urlsByTargetAndPath({ targetType, domain, path: urlPath })
  .with(url => url.type.$switch({
    canonical: null,
    redirect: p.url.canonical({ targetType, target: url.target })
  }).$bind('canonical'))
```

Access in template:

```vue
<div v-for="article in articles.value" :key="article.id">
  <h3>{{ article.title }}</h3>
  <span>by {{ article.authorProfile?.firstName }}</span>
  <Tag :value="article.categoryData?.name" />
</div>
```

### Nested `.with()` (with inside with)

```javascript
const eventPath = computed(() =>
  path.myService.event({ event: eventId })
    .with(event => path.myService.eventState({ event: event.id }).bind('state')
      .with(state => path.myService.roundPairs({
        event: event.id,
        round: state.round
      }).bind('roundPairs'))
    )
)
```

## Step 4 – Conditional loading with `useClient`

Use `useClient()` to check authentication state and conditionally build paths:

```javascript
import { useClient } from '@live-change/vue3-ssr'

const client = useClient()

// Path that only loads for logged-in users (null path = no fetch)
const myDataPath = computed(() =>
  client.value.user && path.blog.myArticles({})
)

// Path that only loads for admins
const adminPath = computed(() =>
  client.value.roles.includes('admin') && path.blog.allArticles({})
)

const [myData, adminData] = await Promise.all([
  live(myDataPath),
  live(adminPath),
])
```

When the path is `null` / `false` / `undefined`, `live()` returns a ref with `null` value and does not subscribe.

### Conditional rendering in templates

```vue
<template>
  <!-- Admin-only button -->
  <Button v-if="client.roles.includes('admin')"
    label="Create" icon="pi pi-plus" @click="create" />

  <!-- Show different content based on auth -->
  <div v-if="client.user">
    <!-- Authenticated content -->
  </div>
  <div v-else>
    <p>Please sign in to see your articles.</p>
    <router-link :to="{ name: 'user:signIn' }">Sign in</router-link>
  </div>
</template>
```

## Step 5 – Dependent paths

When one path depends on data from another, load them sequentially:

```javascript
// First load
const [article] = await Promise.all([live(articlePath)])

// Dependent path using data from first load
const authorPath = computed(() =>
  article.value && path.userIdentification.identification({
    sessionOrUserType: article.value.authorType,
    sessionOrUser: article.value.author
  })
)
const [author] = await Promise.all([live(authorPath)])
```

Or use `.with()` to combine them in a single query (preferred when possible).

## Step 6 – Props-based paths in components

When building reusable components that receive IDs as props:

```vue
<script setup>
  import { computed } from 'vue'
  import { usePath, live } from '@live-change/vue3-ssr'

  const props = defineProps({
    articleId: { type: String, required: true }
  })

  const path = usePath()

  const articlePath = computed(() => path.blog.article({ article: props.articleId }))
  const [article] = await Promise.all([live(articlePath)])
</script>
```

## Summary

| Pattern | When to use |
|---|---|
| `computed(() => path.xxx(...))` | Path depends on reactive values |
| `useFetch(path.xxx(...))` | One-time data fetch (not reactive) |
| `.with(item => path.yyy(...).bind('field'))` | Attach related objects |
| `client.value.user && path.xxx(...)` | Load only when authenticated |
| `client.value.roles.includes('admin')` | Load/show only for specific roles |
| Sequential `live()` calls | Path depends on data from previous load |
