---
description: Rules for LiveChange backend service architecture and directory structure
globs: **/services/**/*.js, **/server/**/*.js, server/**/*.js
---

# LiveChange backend – service architecture (Claude Code)

Use these rules whenever you work on backend services in this repo or other live-change-stack projects.

## Service must be a directory

- Each LiveChange service **must be a directory**, not a single file.
- Use a consistent structure:

```
server/services/<serviceName>/
  definition.js  # createServiceDefinition + use – no models/actions here
  index.js       # imports definition + all domain files, exports definition
  config.js      # optional – reads definition.config and exports plain object
  <domain>.js    # domain files: models, views, actions, triggers
```

## `definition.js`

- Import `app` from `@live-change/framework`.
- Create the service definition **without** registering models/actions/views there.
- If the service uses relations or access control, **always** add the plugins in `use`.

```js
import { app } from '@live-change/framework'
import relationsPlugin from '@live-change/relations-plugin'
import accessControlService from '@live-change/access-control-service'

const definition = app.createServiceDefinition({
  name: 'myService',
  use: [relationsPlugin, accessControlService]
})

export default definition
```

## `index.js`

- Import `definition`.
- Import all domain files (models/views/actions/triggers) as side-effect imports.
- Re-export `definition` as default.

```js
import definition from './definition.js'

import './modelA.js'
import './modelB.js'
import './authenticator.js'

export default definition
```

## `config.js` (optional)

- Read `definition.config` (set in `app.config.js`).
- Apply defaults and export a plain object.

```js
import definition from './definition.js'

const {
  someOption = 'default'
} = definition.config

export default { someOption }
```

## Registering the service in the app

### `services.list.js`

- Always import the service from its `index.js`:

```js
import myService from './services/myService/index.js'

export default {
  // ...
  myService
}
```

### `app.config.js`

- Make sure `services: [{ name }]` matches the name in `createServiceDefinition`.
- Keep a **sensible order** of services:
  - core/common services and plugins first,
  - application-specific services last (they can depend on earlier ones).

```js
services: [
  { name: 'user' },
  { name: 'session' },
  { name: 'accessControl' },
  // ...
  { name: 'myService' }
]
```

## Inspecting services with `describe`

Use the `describe` CLI command to see what the framework generated from your definitions (models, views, actions, triggers, indexes, events). From the app root (directory with `.node-version` / `.nvmrc`), run Node via **fnm** so the toolchain matches the project — see rule `live-change-node-toolchain-fnm`.

```bash
# All services overview
fnm exec -- node server/start.js describe

# One service in YAML (shows all generated code)
fnm exec -- node server/start.js describe --service myService --output yaml

# Specific entity
fnm exec -- node server/start.js describe --service myService --model MyModel --output yaml
```

This is especially useful after using relations (`userItem`, `itemOf`, `propertyOf`) — `describe` shows all the auto-generated views, actions, triggers, and indexes.

## When to create a new service

- When you have a clearly separate domain (payments, notifications, devices, etc.).
- When a group of models/actions/views has its own configuration and dependencies.
- When adding it to an existing service would mix unrelated responsibilities.
