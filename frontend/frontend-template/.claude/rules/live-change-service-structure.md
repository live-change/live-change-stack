---
description: Rules for LiveChange service directory structure and file organization
globs: **/services/**/*.js
---

# LiveChange Service Structure

Every LiveChange service **must** be a directory, not a single file.

## Required structure

```
server/services/<serviceName>/
  definition.js   # creates app.createServiceDefinition({ name }) – nothing else
  index.js        # imports definition, imports all domain files, exports definition
  config.js       # optional – reads definition.config, exports resolved config object
  <domain>.js     # one file per domain area (models, views, actions, triggers)
```

## definition.js

Only creates and exports the definition. No models, no actions here.

```js
import App from '@live-change/framework'
const app = App.app()

const definition = app.createServiceDefinition({ name: 'myService' })

export default definition
```

## index.js

Imports definition and all domain files (side-effect imports), then re-exports definition.

```js
import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import './authenticator.js'
import './myModel.js'
import './otherModel.js'

export default definition
```

## config.js (if needed)

Reads `definition.config` set from `app.config.js`, resolves defaults, exports plain object.

```js
import definition from './definition.js'

const { someOption = 'default' } = definition.config

export default { someOption }
```

## Domain files (e.g. myModel.js)

Each file imports `definition` (and `config` if needed) and registers models/views/actions/triggers.

```js
import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

export const MyModel = definition.model({ name: 'MyModel', ... })

definition.view({ name: 'myList', ... })
definition.action({ name: 'doThing', ... })
```

## services.list.js import

Always import from the directory index, not a flat file:

```js
import myService from './services/myService/index.js'   // correct
import myService from './services/myService.js'         // wrong
```

## Reference implementation

See `/home/m8/IdeaProjects/live-change/live-change-stack/services/stripe-service/` as the canonical example.
