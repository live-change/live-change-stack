---
name: live-change-backend-data-migrations
description: Add and run LiveChange service data migrations via definition.migration and app.updateService
---

# Skill: live-change backend data migrations

Use when you need to **migrate existing database rows** after a model or relation change.

## When to use

- Moving fields between models (e.g. `url` from `Scanner` to `Checker`)
- Backfilling relation keys (`scanner.checker`, `check.checker`)
- Any one-time data transform that must not live in `beforeStart` hacks

## Database DAO (migrations only)

Migrations use **raw** `dao.get` / `dao.request` with paths starting with `database`. Full reference: `live-change-stack/docs/docs/server/21-database-dao.md`.

| Wrong | Correct |
|-------|---------|
| `rangeGet` | `tableRange` |
| `get` | `tableObject` |
| `create` | `put` with `{ id, ... }` |
| `indexObjectGet` | `indexRange` + prefix (see below) |
| `update(..., plainObject)` | `update(..., [{ op: 'reverseMerge', value }])` |

```js
function indexPrefixRange(parts) {
  const prefix = parts.map(v => v === undefined ? '' : JSON.stringify(v)).join(':')
  return { gte: prefix + ':', lte: prefix + '_\xFF\xFF\xFF\xFF', limit: 1 }
}
```

## Step 1 — Add migration in the service

Create `migrations.js` (or add to a domain file) and import it from `index.js`:

```js
import definition from './definition.js'

definition.migration({
  name: 'linkScannerToChecker',
  async run({ dao, database, serviceName, app }) {
    const table = 'xmlAlert_Scanner'
    let last = ''
    while (true) {
      const rows = await dao.get(['database', 'tableRange', database, table, {
        gt: last,
        limit: 32
      }])
      if (!rows.length) break
      for (const row of rows) {
        if (row.checker) continue
        await dao.request(['database', 'update'], database, table, row.id, [{
          op: 'reverseMerge',
          value: { checker: checkerId }
        }])
      }
      last = rows[rows.length - 1].id
    }
  }
})
```

## Step 2 — Rules

- **`name`** must be unique and stable; never rename after production run.
- **`run`** uses **DAO only** — not `Model.create` / runtime models.
- Table names: `{serviceName}_{ModelName}` (e.g. `urlChecker_Checker`).
- Make **`run` idempotent** (skip rows already migrated).
- Declare migrations in **declaration order**; only pending names run.

## Step 3 — How it runs

Pending migrations are detected in **`computeChanges`** (compare code definition vs `services` row `migrations` map). They appear in CLI `changes` as `"operation": "runMigration"`.

Apply with (local embedded DB in `tmp.db`, same as `localDev`):

```bash
cd path/to/app
fnm exec -- npm run localUpdate -- --service myService
```

Bare `npm run changes` / `update` connect to an external db-server (`DB_URL` or default port 9417) — use only when that server is running.

Same path as server startup with `updateServices: true` (`app.updateService`).

## Step 4 — Verify

```bash
cd path/to/app
fnm exec -- npm run localChanges -- --service myService
```

After success, the migration name should **not** appear again.

## Docs

- Migrations: `live-change-stack/docs/docs/server/20-migrations.md`
- Database DAO: `live-change-stack/docs/docs/server/21-database-dao.md`
