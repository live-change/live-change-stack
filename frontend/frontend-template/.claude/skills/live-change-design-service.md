---
description: Create or restructure a LiveChange backend service with proper directory layout
---

# Skill: live-change-design-service (Claude Code)

Use this skill when you need to **create or restructure a LiveChange service** in this project or any other live-change-stack project.

## When to use

- You are adding a **new domain service** (payments, devices, notifications, etc.).
- You are splitting logic out of an existing service.
- You want to make sure the service structure follows the project conventions.

## Step 1 – Choose the service name

1. Pick a short, domain-oriented name, e.g. `deviceManager`, `payments`, `notifications`.
2. This name will be used:
   - as `name` in `app.createServiceDefinition({ name })`,
   - as the `name` entry in `app.config.js` (`services: [{ name: '...' }]`),
   - in `services.list.js` as the property key.

## Step 2 – Create the service directory

1. Create `server/services/<serviceName>/`.
2. Inside, create at least:
   - `definition.js`
   - `index.js`
3. Optionally also:
   - `config.js` – for resolving `definition.config`,
   - domain files like `models.js`, `authenticator.js`, `actions.js`, or more fine-grained files.

## Step 3 – Implement `definition.js`

1. Import `app` from `@live-change/framework`.
2. If the service uses relations or access control:
   - import `relationsPlugin` from `@live-change/relations-plugin`,
   - import `accessControlService` from `@live-change/access-control-service`.
3. Call `app.createServiceDefinition({ name: '...', use: [...] })`.
4. **Do not register models, actions or views** in this file – only the definition.

Example:

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

## Step 4 – Implement `index.js`

1. Import `definition` from `./definition.js`.
2. Import all domain files (models, views, actions, triggers, authenticators) as side-effect imports.
3. Export `definition` as the default export.
4. Do **not** put heavy logic into `index.js`.

Example:

```js
import definition from './definition.js'

import './models.js'
import './authenticator.js'
import './actions.js'

export default definition
```

## Step 5 – (Optional) Implement `config.js`

1. Import `definition`.
2. Read `definition.config` and apply default values.
3. Export a plain object.

Example:

```js
import definition from './definition.js'

const {
  someOption = 'default'
} = definition.config

export default { someOption }
```

## Step 6 – Register the service in `services.list.js`

1. Import from the service directory `index.js`:

```js
import myService from './services/myService/index.js'
```

2. Add the service to the exported object:

```js
export default {
  // ...
  myService
}
```

## Step 7 – Register the service in `app.config.js`

1. Ensure there is an entry in `services`:

```js
services: [
  // ...
  { name: 'myService' }
]
```

2. Keep a sensible order:
   - core/common services and plugins (user, session, accessControl, etc.) first,
   - domain-specific application services later.

## Step 8 – Handle dependencies on other services

1. If the service needs to reference models from other services:
   - use `definition.foreignModel('otherService', 'ModelName')` in domain files,
   - do **not** import their model files directly.
2. Make sure the other services are listed **before** this one in `app.config.js`.

