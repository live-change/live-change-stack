# @live-change/codemirror-frontend

SSR Vue app for **CodeMirror 6** with a **collaborative editing** demo wired to `@live-change/codemirror-service`.

## What is implemented

- **Demo route** (`/`): `CodeEditor.vue` — form fields for `targetType`, `target`, document `type`, CM `language`, sync status, version; embeds `Editor.vue`.
- **Collaborative editor** (`Editor.vue`): CodeMirror `collab`, `sendableUpdates` / `receiveUpdates`, `getSyncedVersion`; loads document via `RemoteAuthority`; pushes edits to `codemirror.edit`; applies remote updates from the steps stream.
- **Transport** (`front/src/codemirror/RemoteAuthority.js`): `api.get(['codemirror','document', …])`, `createDocumentIfNotExists`, `inboxReader` on `['codemirror','steps', …]`, `codemirror.edit` for outgoing updates; resync hooks on reconnect.
- **Public exports** (`index.js`): `CodeEditor`, `Editor`, `RemoteAuthority`, `locales`.

## Run locally

From this package directory (use project Node version, e.g. via `fnm`):

- Dev: `yarn dev` or `yarn ssrDev` (see `package.json` scripts).
- Build: `yarn build` (client + SSR + server bundle steps as defined in scripts).

Copy `.env.example` to `.env` if the stack expects env vars for API/SSR (see repo conventions).

## Configuration

Server-side service wiring lives in [`server/services.config.js`](server/services.config.js). The `codemirror` service entry must declare **`documentTypes`** keys that match the document `type` you pass from the UI (e.g. `markdown`, `code`).

## Embedding in another app

Import named exports from `@live-change/codemirror-frontend` or reuse `Editor` / `RemoteAuthority` with your own layout and access control.

## Related package

- Backend persistence and collab merge: [`@live-change/codemirror-service`](../../services/codemirror-service/README.md).
