# @live-change/e2e-test

Reusable E2E testing helpers for LiveChange applications.

This package provides:
- a custom E2E registry API (`e2eSuite`, `test`) for single-process execution
- a runner factory with optional timing reports
- environment utilities (`waitForServerReady`, `firstFreePort`, `createTestEnvHelpers`)
- Playwright browser helper (`createWithBrowser`)
- common test steps (`waitForHydration`, `createUser`, `loginAsUser`, `loginAsNewUserWithRoles`, `logOut`)

## Install in workspace app

Add dependency in application package:

```json
{
  "dependencies": {
    "@live-change/e2e-test": "workspace:*"
  }
}
```

## Minimal setup

### `e2e/e2eSuite.ts`

```ts
export { e2eSuite, test } from '@live-change/e2e-test'
```

### `e2e/runner.ts`

```ts
import { createRunner } from '@live-change/e2e-test'
import { disposeTestEnv, getTestEnv } from './env.js'

const runner = createRunner({
  setupEnv: getTestEnv,
  teardownEnv: disposeTestEnv
})

export const runE2E = runner.runE2E
await runner.runCli(import.meta.url, process.argv.slice(2))
```

### `e2e/withBrowser.ts`

```ts
import { createWithBrowser } from '@live-change/e2e-test'
import { getTestEnv } from './env.js'

export const withBrowser = createWithBrowser(getTestEnv)
```

### `e2e/env.ts`

Use `waitForServerReady`, `firstFreePort`, and `createTestEnvHelpers` from this package inside your project-specific `TestServer` setup.

## Runner scripts

Recommended scripts:

```json
{
  "scripts": {
    "e2e": "node --import tsx e2e/runner.ts",
    "e2e:time": "node --import tsx e2e/execution-time-report.ts"
  }
}
```

`e2e/execution-time-report.ts`:

```ts
import { runE2E } from './runner.js'

runE2E(['--report-time', 'e2e/*.test.ts'])
  .then(code => process.exit(code))
```
