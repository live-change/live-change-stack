# Churn fragmentation benchmark — raport

Data: 2026-09-06T08:57:27.935Z

## Parametry

| parametr | wartość |
| --- | --- |
| `--size` | 100000 |
| stores | 24 |
| prefill / store | 4167 |
| prefill total | 100008 |
| cycles | 2000 |
| pinned cycles | 500 |
| small payload | 1024–8192 B |
| large payload | 1048576 B (1 MiB) |
| small puts / store / cykl | 8 |
| single deletes / store / cykl | 4 |
| TTL prune / cykl | 64 |
| pressure iters | 100 |
| fill payload | 2564.9 MiB |

## Co testowane i po co

`bench/fragmentation` nie łapał wzrostu latency: jeden store, prune ciągłego prefiksu (jedna duża dziura), batchowany `rangeDelete` i zero małych zapisów między prune a large-put.

Ten suite celuje we wspólny freeDB / allocator przy wielu tabelach:

1. **Prefill** — 24 named store'y w jednym env, round-robin, monotoniczne id, 1–8 KiB.
2. **Churn** — K cykli: małe puty, **pojedyncze** `delete` (osobne transakcje), `rangeDelete` ze środka zakresu, TTL-prune najstarszych, mierzony overwrite 1 MiB pod stałym kluczem.
3. **Pressure** — 1 MiB put przeplatany małym churnem. Slope mówi, czy latency **rośnie**, nie tylko jaki jest max.
4. **Pinned reader** — długo żyjący read txn (LMDB; SQLite jeśli się uda przy EXCLUSIVE lock) — strony zwolnione po nim nie wracają do allocatora.

## Podsumowanie liczb

| backend | churn p50 | churn p99 | churn max | slope | pressure p50 | pressure p99 | pressure max | pslope | pinned max | disk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| lmdb | 17.01ms | 54.17ms | 156.73ms | 3.5e-3ms/i | 15.36ms | 25.80ms | 26.29ms | 5.5e-3ms/i | 63.24ms | 7424.0MiB |
| leveldb | 15.81ms | 35.95ms | 63.89ms | 1.7e-4ms/i | 10.89ms | 23.33ms | 28.42ms | 0.023ms/i | skip | 52.9MiB |
| rocksdb | 16.01ms | 30.70ms | 48.30ms | 3.2e-4ms/i | 11.36ms | 16.83ms | 21.48ms | -6.8e-3ms/i | skip | 54.0MiB |
| sqlite | 12.06ms | 34.97ms | 52.41ms | -6.9e-4ms/i | 12.32ms | 35.78ms | 38.57ms | 1.1e-3ms/i | skip | 981.0MiB |

## Latency overwrite vs cykl

Oś Y logarytmiczna. Szukamy **slope**, nie pojedynczego max.

![Churn overwrite](./churn-chart-overwrite.svg)

## Pressure (duży put pod churnem)

![Pressure](./churn-chart-pressure.svg)

## Disk w czasie

![Disk usage](./churn-chart-disk.svg)

## Interpretacja per backend

**lmdb** — max overwrite 156.73 ms — poniżej progu „kilka minut”. Churn slope ≈ 0 — na tej skali nie widać narastania. Pinned reader max 63.24 ms — bez silnego dodatkowego kosztu na tej skali. LMDB: wspólny freeDB dla 24 DBI, first-fit na overflow (1 MiB = 256 stron).

**leveldb** — max overwrite 63.89 ms — poniżej progu „kilka minut”. Churn slope ≈ 0 — na tej skali nie widać narastania. Pinned reader pominięty: leveldb has no pinned-reader API. LSM: brak reuse stron — wzrost to compaction / write amplification.

**rocksdb** — max overwrite 48.30 ms — poniżej progu „kilka minut”. Churn slope ≈ 0 — na tej skali nie widać narastania. Pinned reader pominięty: rocksdb has no pinned-reader API. LSM: brak reuse stron — wzrost to compaction / write amplification.

**sqlite** — max overwrite 52.41 ms — poniżej progu „kilka minut”. Churn slope ≈ 0 — na tej skali nie widać narastania. Pinned reader pominięty: database is locked. SQLite: overflow to linked-list, nie wymaga ciągłego runu stron.

## Wnioski

- Najniższy max overwrite: **rocksdb** (48.30 ms).
- Najwyższy max overwrite: **lmdb** (156.73 ms).
- Żaden backend nie pokazał wyraźnego wzrostu latency vs liczba cykli (slope ≤ 0.05 ms/cykl).
- Żaden backend nie osiągnął kilkuminutowego put. Hipoteza minutowego LMDB wymaga większego K albo większego value (więcej ciągłych overflow pages).

## Artefakty

- `report.json` — pełny wynik runnera (`metrics` + osadzony CSV)
- `churn-timeseries-<backend>.csv` — time-series per backend
- `churn-chart-overwrite.svg`, `churn-chart-pressure.svg`, `churn-chart-disk.svg`
- ten plik: `churn-report.md`
