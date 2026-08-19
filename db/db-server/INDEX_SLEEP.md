# Index sleep on missing dependencies

When an index depends on a table, index, or log that does not exist yet, the database **keeps** the index in config instead of deleting it.

## Behaviour

1. Index start records dependencies in `system.{db}_indexDependencies` (one row per `input.table` / `input.index` / `input.log`).
2. If a source is missing, the index enters **sleep**: no writes to the materialized index, config and stores stay.
3. State is written to `system.{db}_indexState` (`status`: `starting` | `ready` | `sleeping` | `error`, plus `failedOn`, `error`, `phase`, `needsFullRebuild`).
4. When the missing source is created (`createTable` / `createIndex` / `createLog`), the server runs `tryWakeIndexes` and calls `startIndex()` again.
5. If sleep happened during **CREATING** (before an `indexed` opLog entry), wake clears data+opLog and does a full create. Otherwise it resumes via the normal UPDATING path from the last opLog entry.

DAO views: `indexState`, `indexStates`, `indexDependencies`.
