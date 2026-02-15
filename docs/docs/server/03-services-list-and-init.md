---
title: Services list and init
---

# Services list and init

The **services list** is a module that exports one object per service name. `start.js` imports it as a namespace and assigns `serviceConfig.module = services[serviceConfig.name]` for each entry in `app.config.services`, so the app config and the actual service modules are wired together. The same module can also export an **init** function used for seeding or one-time setup when running with `--initScript` or as the app’s `init` callback.

## Wiring in start.js

```javascript
// Source: speed-dating/server/start.js

import appConfig from './app.config.js'
import * as services from './services.list.js'

for(const serviceConfig of appConfig.services) {
  serviceConfig.module = services[serviceConfig.name]
}
appConfig.init = services['init']
```

Every `app.config.services[i]` must have a `name` that exists as an export in `services.list.js`.

## Example: services.list.js (speed-dating)

External packages are imported from `@live-change/*-service`; local services from relative paths. Export names must match the `name` used in `app.config.services`.

```javascript
// Source: speed-dating/server/services.list.js

import timer from '@live-change/timer-service'
import session from '@live-change/session-service'
import user from '@live-change/user-service'
import email from '@live-change/email-service'
import phone from '@live-change/phone-service'
import passwordAuthentication from '@live-change/password-authentication-service'
import userIdentification from '@live-change/user-identification-service'
import identicon from '@live-change/identicon-service'
import localeSettings from '@live-change/locale-settings-service'
import online from "@live-change/online-service"
import accessControl from '@live-change/access-control-service'
import security from '@live-change/security-service'
import notification from '@live-change/notification-service'
import upload from '@live-change/upload-service'
import image from '@live-change/image-service'
// ... more @live-change/*-service imports ...
import hubCoopAuthentication from "./hub-coop-authentication-service/index.js"

export {
  timer,
  session,
  user,
  email,
  phone,
  passwordAuthentication,
  userIdentification,
  identicon,
  localeSettings,
  online,
  accessControl,
  security,
  notification,
  upload,
  image,
  // ...
  hubCoopAuthentication
}

import speedDating from "./speed-dating-service/index.js"
import businessCard from "./business-card-service/index.js"
import peerNote from "./peer-note-service/index.js"
import init from './init.js'

export {
  speedDating,
  businessCard,
  peerNote,
  init
}
```

## Example: init script (speed-dating)

The init function receives **services** (the running service instances). Use it to create users, seed data, or call service-specific APIs. Often used with `createUser` from `@live-change/user-service/init-functions.js`.

```javascript
// Source: speed-dating/server/init.js

import { createUser } from "@live-change/user-service/init-functions.js"
import App from '@live-change/framework'
const app = App.app()
import { faker } from '@faker-js/faker'

export default async function(services) {

  const adminUser = await createUser(services,
    'Test Admin', 'admin@test.com', 'Testy123', 'a1', ['admin'])

  const testUser = await createUser(services,
    'Test User', 'test@test.com', 'Testy123', 'u1', [])

  for(let i = 0; i < 10; i++) {
    const firstName = faker.name.firstName()
    const lastName = faker.name.lastName()
    const name = firstName + ' ' + lastName
    await createUser(services, name, faker.internet.email(), 'Testy123', 'uf'+i, [])
    setTimeout(async () => {
      await services.userIdentification.models.Identification.create({
        id: App.encodeIdentifier(['user_User', 'uf' + i]),
        sessionOrUserType: 'user_User',
        sessionOrUser: 'uf' + i,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        title: faker.person.jobTitle(),
        description: faker.lorem.sentences(2),
        contactsShared: [
          { type: 'email', id: faker.internet.email() },
          { type: 'phone', id: faker.phone.number().replace(/[^0-9]/g, '') }
        ],
        websites: faker.internet.url(),
        linkedin: `https://linkedin.com/in/${faker.person.firstName()}-${faker.person.lastName()}`
      })
    }, 500)

    await services.businessCard.models.ReceivedCard.create({
      state: 'received',
      givenAt: new Date(),
      stateUpdatedAt: new Date(),
      sessionOrUserType: 'user_User',
      sessionOrUser: 'u1',
      giverType: 'user_User',
      giver: 'uf' + i,
      id: App.encodeIdentifier(['user_User', 'u1', 'user_User', 'uf' + i])
    })
    // ...
  }
}
```

## Service index (billing-service)

A typical reusable service exposes a single default export (the definition) and imports its own definition and feature files:

```javascript
// Source: live-change-stack/services/billing-service/index.js

import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
import './billing.js'
import './topUp.js'
export default definition
```

The **definition** is what the framework uses; the side-effect imports register models, actions, views, and triggers on that definition.
