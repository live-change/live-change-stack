---
title: Getting started
---

# Getting started

The server entry point is a single script (typically `server/start.js`) that loads app config, wires service modules from a services list, and calls the CLI **starter**. The starter parses command-line arguments and runs the appropriate mode (dev, ssrDev, apiServer, withDb, withServices, etc.).

## Entry flow

1. Load `app.config.js` (services array, clientConfig, optional remote).
2. Load `services.list.js` and assign each `serviceConfig.module = services[serviceConfig.name]`.
3. Set `appConfig.init` to the init function if present.
4. Optionally read `package.json` for name, version, homepage and merge into `clientConfig`.
5. Call `starter(appConfig, {}, { version })` from `@live-change/cli`.

## Example: start.js (speed-dating / family-tree)

```javascript
// Source: speed-dating/server/start.js (same pattern in family-tree/server/start.js)

import appConfig from './app.config.js'

import * as services from './services.list.js'
for(const serviceConfig of appConfig.services) {
  serviceConfig.module = services[serviceConfig.name]
}
appConfig.init = services['init']

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { accessSync, readFileSync } from 'fs'

const packageJsonPath = dirname(fileURLToPath(import.meta.url))
  .split('/').map((part, i, arr) =>
    join(arr.slice(0, arr.length - i).join('/'), 'package.json')
  ).find(p => { try { accessSync(p); return true } catch(e) { return false }})
const packageJson = packageJsonPath ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) : {}

const name = packageJson.name ?? "Example"
const brandName = process.env.BRAND_NAME || (name[0].toUpperCase() + name.slice(1))
const homepage = process.env.BASE_HREF ?? packageJson.homepage
const baseHref = process.env.BASE_HREF || homepage || 'http://localhost:8001'
const version = process.env.VERSION || packageJson.version

appConfig.clientConfig = {
  version,
  name, brandName, brandDomain, homepage, baseHref,
  ...appConfig.clientConfig
}

import { starter } from '@live-change/cli'

starter(appConfig, {}, { version })
```

## CLI commands (starter)

The starter registers commands such as:

| Command | Description |
|--------|-------------|
| `apiServer` | API server only (WebSocket/SockJS). |
| `devApiServer` | Like apiServer with `--withServices --updateServices`. |
| `memApiServer` | devApiServer + `--withDb --dbBackend mem --createDb`. |
| `dev` | API server + services (dev). |
| `ssrDev` | SSR dev server (Vite). |
| `localDev` / `localDevInit` | Local dev with DB; init can run `--initScript ./init.js`. |
| `memDev` | In-memory DB dev with optional `--initScript`, `--dbAccess`. |
| `ssrServer` | Production SSR server; use `--withApi --withServices --updateServices` to run API and services in same process. |
| `serve` | Production serve (SSR) without extra services. |

## Environment variables

Common defaults (from `@live-change/server` / starter):

- `API_SERVER_HOST` / `API_SERVER_PORT` (default 8002) — API server bind.
- `SSR_SERVER_HOST` / `SSR_SERVER_PORT` (default 8001) — SSR server bind.
- `SESSION_COOKIE_DOMAIN` — Cookie domain for session.
- `DB_NAME` — Database name (e.g. used by setupApp).
- `CONTEXT_POOL_SIZE`, `MAX_QUEUE_SIZE`, `RENDER_TIMEOUT`, `CONTEXT_MAX_USES` — SSR context pool.
- `withDb` / `dbBackend` / `dbRoot` / `createDb` / `dbAccess` — Database options when using CLI flags.

## package.json scripts example

```json
// Typical scripts (e.g. family-tree/package.json)
"localDevInit": "tsx server/start.js localDev --enableSessions --initScript ./init.js --dbAccess",
"dev": "tsx --inspect server/start.js dev --enableSessions",
"ssrDev": "tsx server/start.js ssrDev --enableSessions",
"serveAll": "cross-env NODE_ENV=production node dist/server/start.js ssrServer --withApi --withServices --updateServices --enableSessions",
"apiServer": "node dist/server/start.js apiServer --enableSessions"
```
