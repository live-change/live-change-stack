---
description: LiveChange service data migrations via definition.migration and computeChanges
globs: **/services/**/*.js, **/server/**/*.js, server/**/*.js
---

# LiveChange backend — data migrations

## Declare migrations on the service

```js
definition.migration({
  name: 'stableMigrationName',
  async run({ dao, database, serviceName, app }) {
    // DAO-level reads/writes only
  }
})
```

Import migrations from `index.js` (e.g. `import './migrations.js'`).

## Detection and execution

- Pending migrations are computed in **`ServiceDefinition.computeChanges`**: each declared migration whose `name` is missing from `oldServiceJson.migrations` becomes a `runMigration` change.
- **`app.updateService`** applies schema changes first, then runs migrations, then saves the service row (including the updated `migrations` map).
- CLI **`localChanges`** / **`localUpdate`** (or `changes` / `update --withDb --createDb`) use the same path (`update` calls `app.updateService`).

## Database DAO in `run`

Use raw paths: `tableRange`, `tableObject`, `put`, `update` with `[{ op: 'reverseMerge', value }]`. Not `rangeGet`, `get`, `create`, or `Model.*`.

## Do

- Use **`fnm exec -- npm run localChanges|localUpdate`** from the app directory (embedded LMDB in `tmp.db`).
- Use bare **`npm run changes|update`** only when a remote db-server is running (`DB_URL` / port 9417).
- Keep migrations **idempotent** and **batched** (`tableRange` + `limit`).
- Use table names `{serviceName}_{ModelName}`.
- Add a **new** migration name for each new transform; do not edit names already applied in production.

## Do not

- Use `Model.create` / `update` / `delete` inside `run` (model is always current code only).
- Use wrong DAO ops (`rangeGet`, `indexObjectGet`, plain-object `update`).
- Rely on `beforeStart` for one-time data backfills in production.
- Rename migration `name` after it has been applied.

## Reference

- `live-change-stack/docs/docs/server/20-migrations.md`
- `live-change-stack/docs/docs/server/21-database-dao.md`
