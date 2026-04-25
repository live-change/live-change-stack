---
name: live-change-frontend-range-list
description: Build paginated scrollable lists with RangeViewer, rangeBuckets and .with()
---

# Skill: live-change-frontend-range-list (Claude Code)

Use this skill when you build **paginated, scrollable lists** backed by DAO ranges in a LiveChange frontend.

## When to use

- You need a list that loads items in pages (infinite scroll).
- The list is backed by a DAO range view (e.g. `articlesByCreatedAt`).
- You want to attach related objects to each item via `.with()`.

## Step 1 – Define the path function

The path function receives a `range` object (with `gt`, `gte`, `lt`, `lte`, `limit`, `reverse`) and returns a DAO path.

Use `reverseRange()` to display items newest-first:

```javascript
import { reverseRange } from '@live-change/vue3-ssr'

function articlesPathRange(range) {
  return path.blog.articlesByCreatedAt({ ...reverseRange(range) })
}
```

## Step 1a – Hard rules for index-backed ranges

For lists loaded with `RangeViewer` / `rangeBuckets`:

- backend views should use `sortedIndexRangePath`, not `indexRangePath`,
- keep `range.gt/gte/lt/lte` for pagination cursor only,
- never override `gt/lt` in frontend `pathFunction` with ad-hoc filters.

Why:

- RangeViewer computes next buckets from previous cursor boundaries,
- replacing cursor fields causes repeated slices and broken infinite loading.

## Step 2 – Attach related objects with `.with()`

Chain `.with()` calls to load related data for each item:

```javascript
function articlesPathRange(range) {
  return path.blog.articlesByCreatedAt({ ...reverseRange(range) })
    .with(article => path.userIdentification.identification({
      sessionOrUserType: article.authorType,
      sessionOrUser: article.author
    }).bind('authorProfile'))
    .with(article => path.blog.articleStats({ article: article.id }).bind('stats'))
}
```

Each `.with()` call:
- receives a proxy of the item,
- builds a path to the related data,
- calls `.bind('fieldName')` to attach the result under that field name.

Important:
- this proxy is Path DSL input, not a hydrated runtime item
- do not branch with imperative `if/else` on proxy fields inside `.with(...)`
- for type-based conditional branches, use `$switch(...).$bind(...)`

```javascript
function settlementsPathRange(range) {
  return path.accounting.settlementsByTransaction({ ...range })
    .with(settlement => settlement.subjectType.$switch({
      invoice_CostInvoice: path.invoice.costInvoice({ costInvoice: settlement.subject }),
      invoice_IncomeInvoice: path.invoice.incomeInvoice({ incomeInvoice: settlement.subject }),
      hr_CivilContract: path.hr.civilContract({ civilContract: settlement.subject })
    }).$bind('subjectDoc'))
}
```

Nested `.with()` is also supported:

```javascript
function eventsPathRange(range) {
  return path.myService.allEvents({ ...reverseRange(range) })
    .with(event => path.myService.eventState({ event: event.id }).bind('state')
      .with(state => path.myService.roundPairs({ event: event.id, round: state.round }).bind('roundPairs'))
    )
}
```

## Step 3 – Use `<RangeViewer>` in the template

```vue
<template>
  <RangeViewer
    :pathFunction="articlesPathRange"
    :canLoadTop="false"
    canDropBottom
    loadBottomSensorSize="3000px"
    dropBottomSensorSize="5000px"
  >
    <template #empty>
      <p class="text-center text-surface-500 my-4">No articles yet.</p>
    </template>
    <template #default="{ item: article }">
      <Card class="mb-2">
        <template #content>
          <h3>{{ article.title }}</h3>
          <p class="text-sm text-surface-500">By {{ article.authorProfile?.firstName }}</p>
        </template>
      </Card>
    </template>
  </RangeViewer>
</template>
```

Key props:

| Prop | Default | Description |
|---|---|---|
| `pathFunction` | required | `(range) => path` – builds the DAO path for a given range |
| `bucketSize` | `20` | Items per page |
| `canLoadTop` / `canLoadBottom` | `true` | Whether loading in each direction is allowed |
| `canDropTop` / `canDropBottom` | `false` | Whether to drop pages that scrolled far out of view |
| `loadBottomSensorSize` | `'500px'` | How far before the bottom to trigger loading (increase for smoother UX) |
| `dropBottomSensorSize` | `'5000px'` | How far to keep before dropping |
| `frozen` | `false` | Pause live updates |

Slots:

| Slot | Props | Description |
|---|---|---|
| `default` | `{ item, bucket, itemIndex, bucketIndex }` | Render each item |
| `empty` | – | Shown when there are no items |
| `loadingTop` / `loadingBottom` | – | Loading spinners |
| `changedTop` / `changedBottom` | – | Indicators when data changed while frozen |

## Step 4 – Low-level `rangeBuckets` (optional)

For advanced control, use `rangeBuckets` directly:

```javascript
import { rangeBuckets, reverseRange } from '@live-change/vue3-ssr'

const { buckets, loadBottom, dropTop, freeze, unfreeze } = await rangeBuckets(
  (range) => path.blog.articlesByCreatedAt({ ...reverseRange(range) }),
  { bucketSize: 20 }
)
```

Iterate in the template:

```vue
<template v-for="(bucket, bi) in buckets.value" :key="bi">
  <div v-for="(item, ii) in bucket.data.value" :key="item.id">
    <!-- render item -->
  </div>
</template>
```

## Step 5 – Optional filters without breaking range cursor

When your list supports optional filtering (for example `month`), do not push raw field values into `gt/gte/lt/lte` from the frontend.

Why:

- Range boundaries are compared against full index keys, not a single field.
- `RangeViewer` controls `gt/lt` for pagination; overriding them breaks infinite scroll behavior.

Correct pattern:

1. Keep RangeViewer cursor in `range` (`...reverseRange(range)`).
2. Send optional filters as separate params (`month`, `state`, etc.).
3. Let backend view apply prefix logic (`sortedIndexRangePath` with longer key prefix or `App.utils.prefixRange`).

```js
function transactionsPathRange(range) {
  return path.bankAccount.bankTransactionsByBankAccountAndDate({
    bankAccount: accountId,
    month: month.value || undefined,
    ...reverseRange(range)
  })
}
```

## Step 6 – Reactive filter changes (no hidden bucket bugs)

If `pathFunction` depends on reactive filters (for example month/company/status), prefer `ReactiveRangeViewer` over mutating `RangeViewer` input directly.

Why:

- changing filters can recreate bucket state in subtle ways
- forcing rerender with ad-hoc `:key` works, but spreads fragile logic across pages
- `ReactiveRangeViewer` centralizes safe reload behavior

```vue
<ReactiveRangeViewer
  :pathFunction="transactionsPathRange"
  :sourceKey="JSON.stringify({ month: filterByMonth ? month : null, accountId })"
  :preserveHeightOnReload="true"
  :canLoadTop="false"
  canDropBottom
  loadBottomSensorSize="3000px"
  dropBottomSensorSize="8000px"
>
  <template #default="{ item }">
    <BankTransactionListItem :transaction="item" />
  </template>
</ReactiveRangeViewer>
```

Use `sourceKey` as the explicit reload trigger when filter inputs change.

## Checklist – range pagination safety

- [ ] backend index view is based on `sortedIndexRangePath`
- [ ] frontend `pathFunction` forwards `range` unchanged (`...range` or `...reverseRange(range)`)
- [ ] domain filters (`month`, `year`, `status`) are separate view params
- [ ] no manual cursor overrides (`gt/gte/lt/lte`) in frontend code
- [ ] if narrowing is needed, backend uses index prefix design first, `prefixRange` only as fallback
