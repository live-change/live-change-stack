---
title: Service data migrations
---

# Service data migrations

Data migrations run at the **database level** when a service definition is updated. They are declared on the service definition and executed through the same path as schema updates (`app.updateService`, CLI `changes` / `update`).

## Declaring a migration

```javascript
import definition from './definition.js'

definition.migration({
  name: 'linkScannerToChecker',
  async run({ dao, database, serviceName, app }) {
    const table = 'xmlAlert_Scanner'
    let last = ''
    while (true) {
      const batch = await dao.get(['database', 'tableRange', database, table, {
        gt: last,
        limit: 32
      }])
      if (!batch.length) break
      for (const row of batch) {
        if (row.checker) continue
        await dao.request(['database', 'update'], database, table, row.id, [{
          op: 'reverseMerge',
          value: { checker: checkerId }
        }])
      }
      last = batch[batch.length - 1].id
    }
  }
})
```

- **`name`** — stable identifier; after a successful `update`, the migration entry is stored in the service record’s `migrations` map (table `services`), same as models and indexes.
- **`run`** — async function; use `dao` and `database` only (not model runtime). Models in code are always the **current** definition.

Register migrations in a side-effect file imported from `index.js` (e.g. `./migrations.js`).

## Database DAO

Migrations use the **raw database protocol** on `app.dao`, not `Model.rangeGet()` / `Model.create()`.

See [Database DAO protocol](/server/21-database-dao.html) for all operations (`tableRange`, `tableObject`, `put`, `update`, `indexRange`, …) and common mistakes (`rangeGet` vs `tableRange`).

## How pending migrations are detected

`ServiceDefinition.computeChanges(oldServiceJson)` compares the **current** definition with the definition stored in the database (table `services`):

- For each migration declared in code, if its `name` is **not** present in `oldServiceJson.migrations`, a change is emitted:

```json
{
  "operation": "runMigration",
  "name": "linkScannerToChecker",
  "migration": { ... }
}
```

After `update` runs the migration and persists the new service definition, that name appears in `migrations` on the stored row, so it is not scheduled again. This matches how models and indexes work: `changes` lists pending work; `update` applies it and saves the new definition.

## Execution order

1. Schema changes from `computeChanges` (create/rename models, indexes, queries, …) — `database` updater.
2. **`runMigration`** changes — migrations updater (after schema).
3. Service definition persisted to `services`, including the updated `migrations` map.

## CLI

Local development (embedded LMDB in `tmp.db`):

```bash
fnm exec -- npm run localChanges -- --service myService
fnm exec -- npm run localUpdate -- --service myService
```

Remote db-server (`DB_URL` or default port 9417):

```bash
fnm exec -- node server/start.js changes --service myService
fnm exec -- node server/start.js update --service myService
```

`update` calls `app.updateService` (same as server startup with `updateServices`).

## Guidelines

- **Idempotent** — safe if `run` is executed more than once (e.g. only update rows missing the new field).
- **Batch** — paginate with `tableRange` and a reasonable `limit`.
- **No model API** — use `dao.get` / `dao.request` on table names (`serviceName_ModelName`).
- **One concern per migration** — add a new named migration instead of editing an old one after it has run in production.

## Related

- [Database DAO protocol](/server/21-database-dao.html)
- [Service definition](/server/04-service-definition.html)
- [Getting started — describe & update](/server/01-getting-started.html)
