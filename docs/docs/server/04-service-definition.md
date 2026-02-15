---
title: Service definition
---

# Service definition

A service is defined with **app.createServiceDefinition({ name, use })**. The **name** must match the entry in `app.config.services` and in `services.list.js`. The **use** array lists dependencies: other service definitions and plugins (e.g. relationsPlugin) that provide models, access control, or processors.

## Creating the definition

Use the global app from `@live-change/framework` and call `createServiceDefinition`. Export the definition and in other files call `definition.model()`, `definition.action()`, `definition.view()`, `definition.trigger()`, etc.

```javascript
// Source: live-change-stack/services/billing-service/definition.js

import App from '@live-change/framework'
const app = App.app()

import userService from '@live-change/user-service'
import relationsPlugin from '@live-change/relations-plugin'
import accessControlService from '@live-change/access-control-service'

const definition = app.createServiceDefinition({
  name: "billing",
  use: [ userService, relationsPlugin, accessControlService ]
})

export default definition
```

## Example: speed-dating service

Local project service with user, email, relations, and access control:

```javascript
// Source: speed-dating/server/speed-dating-service/definition.js

import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'
import userService from '@live-change/user-service'
import emailService from '@live-change/email-service'
import accessControlService from '@live-change/access-control-service'

const definition = app.createServiceDefinition({
  name: "speedDating",
  use: [ userService, emailService, relationsPlugin, accessControlService ]
})

export default definition
```

## Example: scan service

Minimal dependencies (relations, user, access control):

```javascript
// Source: ipi-web/scan/server/scan-service/definition.js

import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'
import userService from '@live-change/user-service'
import accessControlService from '@live-change/access-control-service'

const definition = app.createServiceDefinition({
  name: "scan",
  use: [ relationsPlugin, userService, accessControlService ]
})

export default definition
```

## Typical dependencies

- **userService** — Users and session/user context; often needed for `client.user`, ownership, and user-scoped models.
- **relationsPlugin** — Adds propertyOf, itemOf, propertyOfAny, itemOfAny, boundTo, relatedTo to models.
- **accessControlService** — Roles and object-level access (invitations, visibility).
- **emailService** — Sending email (e.g. speed-dating invites).

The **definition** object is then used in the same or other files to define models, actions, views, triggers, indexes, and foreign models.
