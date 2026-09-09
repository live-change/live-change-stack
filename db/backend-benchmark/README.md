# `@live-change/db-backend-benchmark`

Contract tests, consistency checks, durability, table/index coverage, benchmarks and stress for LiveChange db backends. Each `(backend, suite file)` runs in a child process so a native crash or `process.exit` is a test result, not the end of the run.

Backends: `lmdb`, `memory` (rbtree), `leveldb`, `memdown`, `rocksdb`, `sqlite`.

## Run

From this directory, with the repo Node version:

```bash
fnm exec -- node bin/run.js --backend lmdb,memory
fnm exec -- node bin/run.js --backend leveldb,rocksdb --suite contract,stress
fnm exec -- node bin/run.js --suite bench --size 10000
fnm exec -- npm test
fnm exec -- npm run bench
fnm exec -- npm run stress
```

Install native extras from the **umbrella repo root** only (`yarn install`). Do not run install inside this folder.

`--backend all` probes every engine. Missing native modules (`leveldown`, `rocksdb`, `better-sqlite3`) are reported as `unavailable`, not as a runner crash.

If `level-rocksdb` fails to compile, install with optional deps skipped for that package, then re-run; rocksdb will show as unavailable.

## Flags

| Flag | Default | Meaning |
|---|---|---|
| `--backend` | `lmdb,memory` | comma-separated or `all` |
| `--suite` | `wiring,contract,consistency,durability,table` | or `all` / `bench` / `stress` |
| `--timeout` | per suite | ms per file |
| `--keep` | false | leave `tmp/` |
| `--strict` | false | missing `countGet` etc. fail instead of skip |
| `--size` | 10000 | N for bench/stress |
| `--json` | `report.json` | report path |

## Suites

- **wiring** — `createBackend` load, open/close, put roundtrip, `deleteStore`
- **contract** — Store get/put/delete, range bounds, count, rangeDelete, index-key order, observables
- **consistency** — read-your-writes, concurrent puts, overlapping observers, writes during `rangeGet`
- **durability** — close/reopen; SIGKILL then reopen (`memory` / `memdown` skip)
- **table** — Table/Log/Index/opLog, 40 tables
- **bench** — ops/s, p50/p99, RSS, disk (not pass/fail except crash)
- **stress** — large N, unbounded range, many stores/observers, overlapping delete/put

Workers monkey-patch `process.exit` so LMDB “TREE LEAKING” becomes a failed assertion.

## Known backend gaps (from this harness)

Do not treat these as harness bugs. Fix the stores (or `backend.js` `deleteStore`) in a follow-up.

### leveldb / memdown (same `@live-change/db-store-level`)

- `deleteStore` → `store.clear()` but Level Store has no `clear()` (`wiring/delete-store`, `stress/delete-store-while-observe`)
- no `countGet` / `countObservable` (skipped unless `--strict`)
- limited range observables do not refill after delete (`contract/limited-range-observable`, `limited-reverse-range-observable`)
- overlapping live ranges drift from `rangeGet` (`consistency/overlapping-observers`)

Point/range CRUD, durability close/reopen, table crud/index, and most stress cases **do pass** on leveldb. Native crash was not reproduced on this machine.

### rocksdb

Uses the raw `rocksdb` down (same pattern as `leveldown`) plus `db-store-level`. The old `level-rocksdb` convenience package is already a LevelUP instance; wrapping it in `levelup()` again fails with `Database is not open`.

Expected fails match leveldb until that store is fixed (`clear()`, count, limited-range refill).

### sqlite

`@live-change/db-store-sqlite` on `better-sqlite3`: one `WITHOUT ROWID` table per named store, WAL, `synchronous=NORMAL`. `deleteStore` is `DROP TABLE`. Count is `SELECT COUNT(*)`. Kill-reopen should pass.

### lmdb

`rangeGet({})` without `limit` throws after 4096 keys (`stress/unbounded-range` asserts this).

### memory

Not durable (durability suites skip). `rangeDelete` / empty `id` aligned with the Store contract.
