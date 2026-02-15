---
title: App config
---

# App config

Application configuration is set on `app.config` (assigned to `App.app().config` in practice via the object you pass to the CLI starter). The main pieces are **services** (array of service configs), **clientConfig** (passed to the frontend), and optionally **remote** (for connecting to other Live Change backends).

## Structure

- **`services`** — Array of `{ name, ...serviceOptions }`. Each entry must have a `name` that matches an export in `services.list.js`; `start.js` assigns `serviceConfig.module = services[serviceConfig.name]`.
- **`clientConfig`** — Merged with version, name, brandName, baseHref, etc. in `start.js` and sent to the client.
- **`init`** — Optional function; set in `start.js` from `services['init']` for seed/init scripts.
- **`remote`** — Optional map of remote app names to connection config (protocol, url, definition, settings).

## Example: services array (speed-dating)

```javascript
// Source: speed-dating/server/app.config.js

import dotenv from 'dotenv'
dotenv.config()
import App from "@live-change/framework"
const app = App.app()

const contactTypes = ['email', 'phone']
const remoteAccountTypes = [ 'hubCoop' ]
import securityConfig from './security.config.js'
import documentTypePage from './page.documentType.js'

app.config = {
  clientConfig: {},
  services: [
    { name: 'timer' },
    { name: 'session', createSessionOnUpdate: true },
    { name: 'user', contactTypes, remoteAccountTypes },
    { name: 'email' },
    { name: 'phone' },
    { name: 'passwordAuthentication', contactTypes, signInWithoutPassword: true },
    { name: 'userIdentification', ignoreDefaultFields: true, fields: { ... } },
    { name: 'accessControl', createSessionOnUpdate: true, contactTypes,
      inviteMessageActionByObjectType: { speedDating_Event: 'inviteToSpeedDatingEvent' } },
    { name: 'security', ...securityConfig },
    { name: 'prosemirror', documentTypes: { page: documentTypePage }, testLatency: 2000 },
    { name: 'speedDating' },
    { name: 'businessCard' },
    { name: 'hubCoopAuthentication', apiAddress: process.env.HUB_COOP_API_ADDRESS, serviceId: process.env.HUB_COOP_SERVICE_ID },
    { name: 'backup', port: 8007 },
    // ...
  ]
}
```

## Example: service options (userIdentification fields)

Service-specific options are passed through to the service definition. Example: custom fields for user identification:

```javascript
// Source: speed-dating/server/app.config.js (excerpt)

{
  name: 'userIdentification',
  ignoreDefaultFields: true,
  fields: {
    firstName: {
      type: String,
      softValidation: ['nonEmpty', { name: 'minLength', length: 2 }],
      validation: [{ name: 'maxLength', length: 32 }]
    },
    lastName: { type: String, ... },
    title: { type: String, ... },
    description: { type: String, ... },
    contactsShared: { type: Array, of: { type: Object, properties: { type, id } }, softValidation: ['nonEmpty'] },
    website: { type: String, validation: ['httpUrlSoft', { name: 'maxLength', length: 300 }] },
    linkedin: { type: String, validation: [{ name: 'maxLength', length: 80 }] },
    image: { type: String }
  }
}
```

## Example: remote (exchange)

For apps that connect to another Live Change API (e.g. wallet), use **remote**:

```javascript
// Source: ipi-web/exchange/server/app.config.js (excerpt)

function baseToApi(base) {
  if(!base) return base
  return base.replace(/^http/, 'ws').replace(/\/$/, '') + '/api/ws'
}

app.config = {
  services: [ /* ... */ ],
  remote: {
    walletConnect: {
      protocol: 'ws',
      url: baseToApi(process.env.WALLET_BASE) || 'ws://127.0.0.1:8001/api/ws',
      definition: walletConnectDefinition,
      settings: {
        queueRequestsWhenDisconnected: true,
        requestSendTimeout: 23000,
        requestTimeout: 46000,
        queueActiveRequestsOnDisconnect: true,
        autoReconnectDelay: 1000,
        logLevel: 1,
        connectionMonitorFactory: (connection) =>
          new Dao.ConnectionMonitorPinger(connection, { pingInterval: 10000, pongInterval: 23000 }),
        headers: { ...(process.env.WALLET_BASIC_AUTH ? { Authorization: 'Basic ' + Buffer.from(...).toString('base64') } : {}) }
      }
    }
  }
}
```

## clientConfig merge in start.js

`start.js` typically augments `appConfig.clientConfig` with values from `package.json` and env:

```javascript
// Source: speed-dating/server/start.js (excerpt)

appConfig.clientConfig = {
  version,
  name, brandName, brandDomain, homepage, baseHref, brandSmsFrom,
  ...appConfig.clientConfig
}
```
