---
title: Indexes and foreign models
---

# Indexes and foreign models

**Indexes** on models enable efficient range and lookup views. **Foreign models** let one service reference entities from another service (e.g. user Identification from userIdentification service) and use them in views or simple queries.

## Indexes on a model

Define **indexes** in **definition.model({ indexes: { ... } })**. Each index has a **property** (single key or array of keys) and optionally **multi: true** for multi-value keys (e.g. participants).

```javascript
// Source: speed-dating/server/business-card-service/card.js

const ReceivedCard = definition.model({
  name: "ReceivedCard",
  // ...
  indexes: {
    byOwnerAndStateAndTime: {
      property: ['sessionOrUserType', 'sessionOrUser', 'state', 'givenAt']
    }
  }
})
```

```javascript
// Source: ipi-web/scan/server/scan-service/model.js

const Transaction = definition.model({
  name: 'Transaction',
  properties: { ... },
  indexes: {
    byTime: { property: 'time' },
    byHash: { property: 'hash' },
    byParticipants: { property: 'participants', multi: true },
    byAccSequence: { property: 'accSequence', multi: true },
    // ...
  }
})
```

## Index key composition

The framework **always appends the object `id`** to the index key automatically. The internal key format is:

```
JSON.stringify(prop1):JSON.stringify(prop2):...:JSON.stringify(propN)_<obj.id>
```

For example, an index `byDeviceAndStatus: { property: ['device', 'status'] }` produces keys like:

```
"device123":"online"_<obj.id>
```

Because `id` is always appended, you should **never include `id` in the `property` array** — it would be serialized as a regular property value and duplicated in the key.

```javascript
// ✅ Correct — id is appended automatically
indexes: {
  byCompanyAndDate: {
    property: ['company', 'issueDate']
  }
}

// ❌ Wrong — id is redundant and creates a broken key
indexes: {
  byCompanyAndDate: {
    property: ['company', 'issueDate', 'id']
  }
}
```

When `hash: true` is set on the index, the object ID is hashed with SHA1 (base64) instead of being appended in plain form. This is used for indexes where the key prefix alone is unique enough and you want shorter keys.

## Function indexes (derived keys)

Use a `function` index when key parts are derived (for example month bucket `YYYY-MM` from `date`) or when one row should emit custom index rows.

The most common pattern is:

- read source rows from `input.table(...)`
- map each source row to `{ id, to }`
- build `id` as a serialized composite key plus `_' + sourceId`
- prefer `table.map(mapper).to(output)` for cleaner index pipelines

> **IMPORTANT:** Index functions are **serialized via `toString()`** and executed on a remote server. All mappers, helpers, and variables **must be defined inside the function body**. References to module-scope functions, imports, or outer closures will silently be `undefined` at runtime. This applies to both model-level function indexes and standalone `definition.index(...)`.

```javascript
indexes: {
  byBankAccountAndMonthAndDate: {
    function: async (input, output, { tableName }) => {
      const table = await input.table(tableName)
      const mapper = obj => ({
        id: [
          obj.bankAccount,
          obj.date?.slice(0, 7),   // YYYY-MM
          obj.date
        ].map(v => JSON.stringify(v)).join(':') + '_' + obj.id,
        to: obj.id
      })
      await table.map(mapper).to(output)
    },
    parameters: {
      tableName: definition.name + '_BankTransaction'
    }
  }
}
```

For frequent queries by month, this approach is usually better than trying to force month filtering into `range.gt/gte/lt/lte` on an index that is prefixed differently.

## Standalone indexes (without a model)

Not every index should live inside `definition.model({ indexes: ... })`.
When an index combines data from multiple equal sources (for example union of two tables), define a standalone service index with `definition.index(...)`, usually in a dedicated `indexes.js` file.

Use standalone indexes when:

- index rows are derived from multiple tables or indexes,
- no single model is the natural owner of the index,
- you need a union/projection layer for cross-table queries.

> **IMPORTANT:** Standalone index functions follow the same serialization constraint as model-level function indexes — all helpers and mappers **must be defined inside the function body**, not in module scope.

Example pattern:

```javascript
definition.index({
  name: 'Urls',
  function: async (input, output) => {
    const redirectMapper = obj => obj && ({ id: /* ... */, to: obj.target })
    const canonicalMapper = obj => obj && ({ id: /* ... */, to: obj.target })

    await input.table('url_Redirect').onChange(
      (obj, oldObj) => output.change(redirectMapper(obj), redirectMapper(oldObj))
    )
    await input.table('url_Canonical').onChange(
      (obj, oldObj) => output.change(canonicalMapper(obj), canonicalMapper(oldObj))
    )
  }
})
```

Real project examples:

- `services/url-service/model.js` (`Urls`, `UrlsWithoutDomain`) – union of canonical + redirect URLs,
- `services/scope-service/indexes.js` – scope/object path indexes built from other indexed data,
- `services/access-control-service/indexes.js` – multi-stage access indexes (`childByParent`, `expandedRoles`, etc.).

Rule of thumb:

- if index logic belongs to one model, keep it in model `indexes`,
- if index logic joins equal domain streams, keep it as standalone `definition.index` in service-level `indexes.js`.

## Using indexes in views

- **Model.rangePath(range)** — Full range over the model (primary order).
- **Model.path(id)** — Single entity by id.
- **Model.sortedIndexRangePath(indexName, keyPrefix, range)** — Range over an index; keyPrefix is the prefix of the index key (e.g. [sessionOrUserType, sessionOrUser, state] for byOwnerAndStateAndTime).
- **Model.indexObjectPath(indexName, key)** — Single object by exact index key.
- **Model.indexObjectPath(indexName, keyPrefix, { limit, reverse })** — One object from index (e.g. last by participants).

```javascript
// Source: speed-dating/server/business-card-service/card.js

return ReceivedCard.sortedIndexRangePath('byOwnerAndStateAndTime', [
  sessionOrUserType, sessionOrUser,
  state
], range)
```

```javascript
// Source: ipi-web/scan/server/scan-service/view.js

return Transaction.indexObjectPath('byHash', props.hash)

return Transaction.sortedIndexRangePath('byParticipants', [props.participant], App.extractRange(props))

return Transaction.indexObjectPath('byParticipants', [props.participant], { limit: 1, reverse: true })
```

## Designing indexes for range UI (`RangeViewer` / `rangeBuckets`)

When a frontend list uses range pagination, backend index choice directly affects correctness.

Use this order of preference:

1. design index prefix to match required filters,
2. query with `sortedIndexRangePath(indexName, keyPrefix, range)`,
3. keep `range` only for cursor pagination (`gt/gte/lt/lte`, `limit`, `reverse`).

Avoid:

- relying on `indexRangePath` semantics for RangeViewer/rangeBuckets pagination flows,
- passing ad-hoc single-field values into `gt/lt` when index key has a wider serialized prefix,
- rewriting cursor bounds in frontend `pathFunction` logic.

Recommended pattern:

- frequent month/year/status filtering -> add dedicated index prefix parts (for example `[bankAccount, month, date]`),
- occasional narrowing on existing index -> backend `App.utils.prefixRange` fallback in view,
- avoid string min/max hacks unless backend cannot be changed.

For concrete view examples and `prefixRange` usage, see [Views](07-views.md). For frontend-side range rules, see [Frontend – Logic and data layer](../frontend/04-logic-and-data-layer.md).

## Foreign models

Use **definition.foreignModel(serviceName, modelName)** to reference a model from another service. You get a proxy that supports path/index access for use in views or in simple-query sources.

```javascript
// Source: speed-dating/server/business-card-service/card.js

const Identification = definition.foreignModel('userIdentification', 'Identification')
```

Then use **Identification** in a simple-query **sources** map or in view logic that needs to read from the userIdentification service.

## Block and custom paths (scan)

When the path is not a simple model path or index path, define helpers (e.g. blockId, blockTransactionsPath) and use them in daoPath:

```javascript
// Source: ipi-web/scan/server/scan-service/view.js

return Block.path(blockId(props.height))
return blockTransactionsPath(props.height, App.extractRange(props))
```

These helpers return DAO paths that the framework resolves to the correct range or object.
