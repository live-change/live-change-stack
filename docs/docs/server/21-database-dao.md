---
title: Database DAO protocol
---

# Database DAO protocol

When you talk to the **database** through `app.dao` (migrations, scripts, admin tools, low-level backfills), paths start with `database` and use operation names defined by **db-server** (`@live-change/db-server/lib/dbDao.js`).

This is **not** the same as:

- **Service actions/views** — paths like `['myService', 'myAction', ...]` (arguments must be wrapped in an array; see DAO protocol for actions).
- **Runtime models** — `Model.get()`, `Model.rangeGet()`, `Model.indexObjectGet()` build the correct `database` paths for you.

Migrations receive `dao` and `database` from `definition.migration({ run({ dao, database }) })`.

## Path shape

```js
// read
await dao.get(['database', operation, dbName, ...args])

// write
await dao.request(['database', operation, dbName, ...args])
```

`dbName` is `app.databaseName` (often `test` in dev).

Table names for service models: `{serviceName}_{ModelName}` (e.g. `ksef_KsefInvoice`).

Index names: `{tableName}_{indexKey}` (e.g. `urlChecker_Checker_byUserUrlHash`).

## Reads (`dao.get`)

### Tables

| Operation | Arguments | Returns |
|-----------|-----------|---------|
| `tableObject` | `dbName`, `tableName`, `id` | Single row or `null` |
| `tableRange` | `dbName`, `tableName`, `range` | Array of rows (`gt`, `gte`, `lt`, `lte`, `limit`, …) |
| `tableCount` | `dbName`, `tableName`, `range?` | Count |

Op-log variants: `tableOpLogObject`, `tableOpLogRange`, `tableOpLogCount`.

**Example — paginate all rows:**

```js
let last = ''
while (true) {
  const batch = await dao.get(['database', 'tableRange', database, tableName, {
    gt: last,
    limit: 32
  }])
  if (!batch.length) break
  for (const row of batch) { /* ... */ }
  last = batch[batch.length - 1].id
}
```

### Indexes

| Operation | Arguments | Returns |
|-----------|-----------|---------|
| `indexObject` | `dbName`, `indexName`, `id` | Index entry when you know the index row `id` |
| `indexRange` | `dbName`, `indexName`, `range` | Index entries in range |
| `indexCount` | `dbName`, `indexName`, `range?` | Count |

Index entries usually have `{ id, to }` where `to` is the target table row id.

**Example — lookup by composite index key** (same prefix as `Model.indexObjectGet`):

```js
function indexPrefixRange(parts) {
  const prefix = parts.map(v => v === undefined ? '' : JSON.stringify(v)).join(':')
  return { gte: prefix + ':', lte: prefix + '_\xFF\xFF\xFF\xFF', limit: 1 }
}

const pointers = await dao.get([
  'database', 'indexRange', database,
  'urlChecker_Checker_byUserUrlHash',
  indexPrefixRange([user, urlHash])
])
const checkerId = pointers[0]?.to
```

### Logs

| Operation | Arguments |
|-----------|-----------|
| `logObject` | `dbName`, `logName`, `id` |
| `logRange` | `dbName`, `logName`, `range` |
| `logCount` | `dbName`, `logName`, `range?` |

### Storage stats (LMDB)

Cheap O(1) snapshots via `mdb_stat` / `env.info` — not reactive; use `dao.get`, not live subscriptions.

| Operation | Arguments | Returns |
|-----------|-----------|---------|
| `databaseStorageStats` | `dbName` | `{ env, stores, totals, wasteBytes }` |
| `tableStorageStats` | `dbName`, `tableName` | `{ data, opLog, entryCount, usedBytes }` |
| `indexStorageStats` | `dbName`, `indexName` | same shape as table (from store UIDs; does not start index code) |
| `logStorageStats` | `dbName`, `logName` | `{ data, opLog: null, entryCount, usedBytes }` |

`env` includes `fileBytes`, `apparentFileBytes`, `allocatedFileBytes`, `mapSize` when the backend is LMDB. `wasteBytes` ≈ freelist / unreclaimed high-water (`fileBytes - totals.storeUsedBytes`).

### OpLog retention

Each database may set `storage.opLogRetentionMs` in its config (merged via `updateDatabaseStorage`):

| Value | Effect |
|-------|--------|
| unset | server default (**2 hours**) |
| `false` / `0` | automatic cleanup disabled for that DB |
| positive number | keep opLog entries newer than this many ms |

db-server runs an automatic cleaner on startup and every 5 minutes (CLI: `--opLogRetentionMs`, `--opLogClearIntervalMs`, `--opLogClearBatchSize`, `--opLogClearDisabled`). Default batch size is 500 with no inter-batch delay. Replicas (`--master`) do not run the cleaner. Console logs progress (`%`, deleted/~estimated deletable, rate, ETA).

Startup cleaning drains each table/index opLog with key-only deletes (opLog `id` is `padTimestamp(ms):seq`, no JSON parse), then writes **one** `clearOpLog` marker per store. Periodic/manual cleaner also uses key-only deletes but still writes a marker when a batch removes entries.

Manual cleanup and live status:

| Operation | Arguments | Returns |
|-----------|-----------|---------|
| `runOpLogCleaner` | `dbName?`, `options?` (`force`, `batchSize`, `maxBatches`, `delayMs`) | `{ started, status }` (work continues in background) |
| `opLogCleanerStatus` | — | `{ running, mode, dbName, batch, deleted, … }` (observable) |

```js
await dao.request(['database', 'runOpLogCleaner'], database, { force: true })
const status = await dao.get(['database', 'opLogCleanerStatus'])
```

Clearing frees LMDB pages onto the freelist (logical opLog size / entry counts drop); the on-disk `data.mdb` high-water mark may stay until a compact copy. `backup-service` `clearOpLogs` remains a complementary pass.

| Operation | Arguments | Returns |
|-----------|-----------|---------|
| `updateDatabaseStorage` | `dbName`, `storagePatch` | merged `storage` object |

```js
await dao.request(['database', 'updateDatabaseStorage'], database, {
  opLogRetentionMs: 2 * 60 * 60 * 1000
})
await dao.request(['database', 'updateDatabaseStorage'], database, {
  opLogRetentionMs: false
})
```

### Metadata

`databasesList`, `databases`, `databaseConfig`, `tablesList`, `indexesList`, `logsList`, `tables`, `indexes`, `logs`, `tableConfig`, `indexConfig`, `indexCode`, `logConfig`, …

### Queries

| Operation | Arguments |
|-----------|-----------|
| `query` | `dbName`, `code`, `params` |
| `queryObject` | `dbName`, `code`, `params` |
| `runQuery` | `dbName`, `queryCodeTable`, `queryCodeId`, `params` |

## Writes (`dao.request`)

### Row operations

| Operation | Arguments | Notes |
|-----------|-----------|-------|
| `put` | `dbName`, `tableName`, `object` | Create or replace row; `object` must include `id` |
| `delete` | `dbName`, `tableName`, `id` | Delete row |
| `update` | `dbName`, `tableName`, `id`, `operations`, `options?` | `operations` is an **array** of mutators |

**Update** — use operation objects, not a plain merge object:

```js
await dao.request(['database', 'update'], database, tableName, rowId, [{
  op: 'reverseMerge',
  value: { field: 'newValue' }
}])
```

Common mutators: `reverseMerge`, `merge`, `conditional` (see db `AtomicWriter`).

There is **no** `create` operation — use `put` for new rows.

### Schema (usually framework / updaters)

`createDatabase`, `deleteDatabase`, `createTable`, `deleteTable`, `renameTable`, `createIndex`, `deleteIndex`, `renameIndex`, `createLog`, `deleteLog`, `renameLog`, `clearDatabaseOpLogs`, `clearTableOpLog`, `clearIndexOpLog`, `updateDatabaseStorage`, `runOpLogCleaner`.

### Logs

`putLog`, `putOldLog`, `clearLog`.

### Queries

`query`, `runQuery` (server-side execution).

## Common mistakes

| Wrong | Correct |
|-------|---------|
| `['database', 'rangeGet', ...]` | `['database', 'tableRange', ...]` |
| `['database', 'get', db, table, id]` | `['database', 'tableObject', db, table, id]` |
| `['database', 'create', ...]` | `['database', 'put', db, table, { id, ... }]` |
| `['database', 'indexObjectGet', ...]` | `['database', 'indexRange', ...]` + prefix range, or runtime `Model.indexObjectGet` |
| `update(..., { field: x })` | `update(..., [{ op: 'reverseMerge', value: { field: x } }])` |

`Model.rangeGet()` in actions/triggers is fine — it is **not** a raw DAO path; the model runtime maps it to `tableRange`.

## When to use what

| Context | API |
|---------|-----|
| Migration / script / one-off backfill | Raw `dao.get` / `dao.request` as above |
| Action, view, trigger (normal service code) | `Model.get`, `Model.rangeGet`, `Model.indexObjectGet`, `Model.create`, … |
| External HTTP client calling a view | Service path + args as array (not `database`) |

## Related

- [Service data migrations](/server/20-migrations.html)
- [Getting started](/server/01-getting-started.html)
