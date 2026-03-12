---
title: Frontend – Getting started
---

# Frontend – Getting started

The first frontend application in Live Change is usually built on top of the `@live-change/frontend-template` starter. This chapter shows:

- how to start a new project from this template
- how to connect it to the backend (Live Change services)
- how the basic run flow works (`memDev`, `dev`, `ssrDev`, `serveAll`, `build`)

## New project based on frontend-template

The simplest way is to treat `@live-change/frontend-template` as a **starter app**:

1. Create a new folder and copy `@live-change/frontend-template` as a starting point (it lives in the `live-change-stack` monorepo under `frontend/frontend-template/`).
2. Configure **services** in `server/app.config.js` and `server/services.list.js`.
3. Customize the frontend under `front/src` (router, config, pages, components).

Typical `scripts` in `package.json`:

```json
\"scripts\": {
  \"memDev\": \"tsx --inspect --expose-gc server/start.js memDev --enableSessions --initScript ./init.js --dbAccess\",
  \"localDevInit\": \"tsx server/start.js localDev --enableSessions --initScript ./init.js --dbAccess\",
  \"localDev\": \"tsx server/start.js localDev --enableSessions --dbAccess\",
  \"dev\": \"tsx --inspect --expose-gc server/start.js dev --enableSessions\",
  \"ssrDev\": \"tsx server/start.js ssrDev --enableSessions\",
  \"serveAll\": \"cross-env NODE_ENV=production node dist/server/start.js ssrServer --withApi --withServices --updateServices --enableSessions\",
  \"apiServer\": \"node dist/server/start.js apiServer --enableSessions\"
}
```

These scripts all start the **same** `server/start.js`, but with different CLI modes (`memDev`, `dev`, `ssrDev`, `ssrServer`, `apiServer`) that are described in the server manual.

## Connecting frontend to backend

Frontend and backend in Live Change share the same application configuration:

- `server/app.config.js` – list of services and their options
- `server/services.list.js` – map from `name -> module` for services
- `server/start.js` – CLI entry point that:
  - loads `app.config.js`
  - wires services from `services.list.js`
  - sets `appConfig.clientConfig`
  - starts `@live-change/cli` (`starter`)

The startup flow is described in detail in [`/server/01-getting-started.md`](/server/01-getting-started.md). The frontend uses the same configuration via:

- `@live-change/vue3-ssr` (client API, SSR, metadata)
- global `clientConfig` (brand, version, base URLs, feature flags)

## First dev run

The most practical commands while working on the frontend are:

- `yarn memDev` – fast dev with in-memory DB (great for UI debugging, no persistence)
- `yarn dev` – dev with services and API (persistent DB)
- `yarn ssrDev` – dev with SSR and Vite (full SSR flow)

Start with `memDev` for new screens – it restarts fast and doesn't require a running database.

## What you get from frontend-template

On the frontend side (`front/`):

- ready client/server entries (`entry-server.js`, `main.js` from `@live-change/frontend-base`)
- basic router (`front/src/router.js`) based on `vite-plugin-pages`
- base i18n and locale configuration (`front/src/config.js`)
- integration with modules:
  - `@live-change/vue3-ssr`
  - `@live-change/vue3-components`
  - `@live-change/frontend-auto-form`
  - service frontends (`user-frontend`, `access-control-frontend`, `content-frontend`, etc.)

The following chapters (`02-project-structure`, `03-ssr-and-routing`, `05-forms-and-auto-form`) break this setup down into concrete steps and recipes.

