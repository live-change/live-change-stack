---
title: Raw HTTP and client credentials
---

# Raw HTTP and `client` credentials

When a service exposes a plain **Express** (or other non-DAO) route, the browser still sends `sessionKey` (cookie or query). The WebSocket / `ApiServer` path already turns that into a full **`client`** object (`session`, `user`, `roles`, …) by running all **authenticators** (`prepareCredentials` and optional `credentialsObservable`).

Use the same pipeline from server code so you do not reimplement session mapping (e.g. `createSessionOnUpdate` + HMAC) or duplicate access rules.

## `App.resolveClientCredentials(input, options?)`

- **`input`**: at least `{ sessionKey, roles: [], ignoreRemoteViews: false }` (same shape as WebSocket credentials before merge).
- **`options.ip`**: forwarded client IP when available (mirrors `ApiServer.daoFactory`).
- **`options.observableWaitMs`**: timeout for each `credentialsObservable` first signal (default `5000`).

Returns a **`client`** object suitable for `view.get` / `action.callCommand` with normal access checks.

## `App.serviceViewGetAsClient(serviceName, viewName, params, client)`

Calls `view.get(params, client)` **without** the internal admin bypass used by `serviceViewGet`. Use this to enforce **`view.access`** and **`accessControl`** for the real user/session.

## `App.serviceViewObservableAsClient(serviceName, viewName, params, client)`

Same as above for `view.observable`.

## Example: screenshot file route

1. Read `sessionKey` from cookie or query.
2. `const client = await app.resolveClientCredentials({ sessionKey, roles: [], ignoreRemoteViews: false }, { ip: req.ip })`.
3. `const row = await app.serviceViewGetAsClient('screenshot', 'screenshot', { screenshot: id }, client)`.
4. Map `notAuthorized` to HTTP 403; missing row to 404.

See [automation/browser-bot/bot-server/server/screenshot/endpoint.js](../../../../automation/browser-bot/bot-server/server/screenshot/endpoint.js) and the testable handler in [deliverScreenshot.js](../../../../automation/browser-bot/bot-server/server/screenshot/deliverScreenshot.js). Run `yarn test:unit` in `bot-server` for HTTP status mapping tests.

## Internals

Shared helpers live in the framework runtime module **`clientCredentials.js`** (`collectAllAuthenticators`, `runPrepareCredentials`, `mergeCredentialSnapshots`, `snapshotClientCredentials`). `ApiServer.daoFactory` uses the same collector and `runPrepareCredentials` so authenticator discovery stays in one place.
