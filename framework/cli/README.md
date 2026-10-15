# LiveChange CLI

Command-line entry for LiveChange apps. Apps call `starter()` from `server/start.js`; `lcli` exposes the same commands.

## localDev vs localDevSplit

`localDev` runs the API (database, services, websocket) and Vite/SSR in **one process**. That is convenient, and it is the wrong isolation model for a long-running locally used app.

In development, SSR does not use `vm` render contexts. Vite `ssrLoadModule` and `transformIndexHtml(url)` run in the main isolate. Vue observers, leftover `renderPage` frames, and parsed API definitions share a heap with RocksDB and task workers. Any one of those leaks eventually kills the whole process, including the database.

Production already splits this: an API pod plus two SSR pods behind a fallback. `localDevSplit` is the local equivalent **without** a load balancer in front of Vite (HMR does not survive that).

## localDevSplit

Runs two child processes:

1. `localApiServer` — long-lived. If it exits, the runner kills SSR and exits non-zero.
2. `ssrDev` **without** `--withApi` — Vite + SSR, proxies `/api` to the API, talks DAO over `ws://127.0.0.1:<apiPort>/api/ws`. If it exits, the runner restarts it.

The parent process is a supervisor only. It does **not** call `setupApp` / `setupTelemetry`, so it does not open the database.

### Package scripts

New LiveChange apps (frontend-template) and bot-server expose:

```bash
yarn localDevSplit
yarn localDevSplitInit   # same, plus --initScript ./init.js
```

Pass extra flags after `--`:

```bash
yarn localDevSplit -- --apiMaxOldSpaceSize 4096 --ssrMaxOldSpaceSize 1024
```

### Heap limits

Each child gets its own V8 old-space cap (`--max-old-space-size`). Defaults are 2048 MB each (4 GB total, isolated).

| Flag | Default | Meaning |
|---|---|---|
| `--apiMaxOldSpaceSize` | 2048 | API heap, MB |
| `--ssrMaxOldSpaceSize` | 2048 | SSR/Vite heap, MB |
| `--apiPort` | 8002 | API listen port |
| `--ssrPort` | 8001 | Vite/SSR listen port |
| `--apiInspectPort` | 9229 | API CDP (`--inspect`). `0` disables |
| `--ssrInspectPort` | 9230 | SSR CDP (`--inspect`). `0` disables |
| `--inspectHost` | 127.0.0.1 | bind host for both inspect ports |

SSR dying at its cap is expected and recoverable (AI prompt fetches retry). The API must not die.

### DevTools / CDP

Each child gets its own inspector so you can take heap snapshots of API and Vite separately:

- API: `chrome://inspect` → `127.0.0.1:9229` (and `--expose-gc`)
- SSR: `chrome://inspect` → `127.0.0.1:9230`

The runner itself is not inspected. Inherited `NODE_OPTIONS --inspect` is stripped from children so they do not collide on 9229. Restarted SSR keeps 9230; reconnect in DevTools after a crash.

### Shared app version

The update banner compares API view `['version', 'version']` with SSR `window.__VERSION__`. In one-process `localDev` both come from the same `argv`. Split children each run `start.js` and yargs `--version` (boolean) must not become the app version.

The runner picks a string version once (`start.js` extraArgs, else `process.env.VERSION`) and sets `VERSION` on **both** children. Do not pass it as `--version` — that flag belongs to yargs. `SsrServer` and `setupApiServer` read `process.env.VERSION` when `settings.version` is not a string.

### API ready gate

The runner starts the API, then waits until a DAO websocket to `ws://127.0.0.1:<apiPort>/api/ws` connects. **There is no startup timeout.** Index rebuilds, cache cleanup, `updateServices`, and migrations can take minutes; killing the API mid-boot corrupts state.

While waiting, the runner logs every 10s:

```
still waiting for API DAO WS (120s elapsed)
```

Only Ctrl-C / SIGTERM aborts the wait. If the API process itself exits (crash, event-loop watchdog kill), the runner shuts down.

### Death policy

- API exit → SIGTERM SSR, 10s grace, SIGKILL remnants, runner exit 1
- SSR exit → restart with backoff 1s / 2s / 5s / 10s / 30s. Counter resets after 60s alive
- 3 SSR exits within 5s → crashloop abort (kill API, runner exit 1)
- SIGINT / SIGTERM on the runner → SIGTERM both children, 10s grace, SIGKILL

### Logs

Created under `logs/<runner-start-date>/` in the app cwd:

```
logs/2026-10-10/
  2026-10-10T10-36-00-runner.log
  2026-10-10T10-36-12-server.log
  2026-10-10T10-37-01-ssr.log
  eventloop-stall-<pid>-report.json
```

- Runner messages (started / ready / crashed / restarting) go to the runner log **and** the terminal. Child stdout/stderr go only to their files.
- Each SSR restart gets a new `*-ssr.log` named with that spawn's timestamp.
- Both children get `EVENTLOOP_STALL_DUMP_DIR` pointing at the day directory, so event-loop stall dumps land next to the session logs instead of cwd.

### How it maps to existing commands

`localDevSplit` does not invent new servers. It spawns the commands that already exist:

- API child: `localApiServer` (services + local DB + createDb)
- SSR child: `ssrDev` without `--withApi` (HTTP proxy `/api`, `serverDao` over websocket)

Keep `localDev` for a single-process session (one inspector, one heap) when you want that.
