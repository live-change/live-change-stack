---
title: Custom services in project
---

# Custom services in project

Custom (project-specific) services live in the app’s **server** directory, typically one folder per service (e.g. `speed-dating-service`, `business-card-service`). Each service has a **definition** (name and use) and one or more files that register **models**, **actions**, **views**, and **triggers**. They are registered in **app.config.services** and exported from **services.list.js**.

## Layout

Example layout (speed-dating):

```
server/
  start.js
  app.config.js
  services.list.js
  init.js
  security.config.js
  speed-dating-service/
    definition.js
    index.js
    event.js
    eventState.js
    participant.js
    pair.js
    config.js
    ...
  business-card-service/
    definition.js
    index.js
    card.js
    config.js
  peer-note-service/
    definition.js
    index.js
    ...
  hub-coop-authentication-service/
    definition.js
    index.js
    authentication.js
    ...
```

- **definition.js** — `app.createServiceDefinition({ name, use })` and export.
- **index.js** — Imports definition and side-effect imports for all feature files (models, actions, views, triggers).
- Other files (e.g. event.js, card.js) import definition and call `definition.model()`, `definition.action()`, `definition.view()`, `definition.trigger()`.

## Registration

**1. app.config.js** — Add an entry with the service **name** (and any options):

```javascript
// Source: speed-dating/server/app.config.js

{ name: 'speedDating' },
{ name: 'businessCard' },
{ name: 'peerNote' },
{ name: 'hubCoopAuthentication', apiAddress: process.env.HUB_COOP_API_ADDRESS, serviceId: process.env.HUB_COOP_SERVICE_ID },
```

**2. services.list.js** — Import the module and export it under the same name (and export init if present):

```javascript
// Source: speed-dating/server/services.list.js

import speedDating from "./speed-dating-service/index.js"
import businessCard from "./business-card-service/index.js"
import peerNote from "./peer-note-service/index.js"
import init from './init.js'

export { speedDating, businessCard, peerNote, init }
```

start.js will set `serviceConfig.module = services[serviceConfig.name]` for each service in app.config.

## Definition and index (speed-dating-service)

```javascript
// definition.js — Source: speed-dating/server/speed-dating-service/definition.js

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

```javascript
// index.js — typically imports definition and all feature files, exports definition
import definition from './definition.js'
import './event.js'
import './eventState.js'
import './participant.js'
// ...
export default definition
```

## Splitting models/actions/views

You can split by domain: e.g. **event.js** for Event model and event-related triggers, **participant.js** for Participant model and actions, **card.js** for ReceivedCard, views, actions, and simple-query. Each file imports **definition** from `./definition.js` and registers its pieces.

## Family-tree example

Family-tree uses the same pattern with local services such as tree-settings-service, tree-order-service, uploaded-files-service, ad-images-service, tree-image-service, random-tree-service. Each has a definition, optional config, and one or more files that define models, views, and actions, and is listed in app.config and services.list.

## Summary

1. Create a folder **server/your-service-name/**.
2. Add **definition.js** (createServiceDefinition, name, use) and **index.js** (import definition + feature files, export definition).
3. Add feature files that call definition.model/action/view/trigger (and simpleQuery if needed).
4. Add `{ name: 'yourServiceName', ...options }` to **app.config.services**.
5. In **services.list.js**, import the module and export it as **yourServiceName**.
