---
title: Frontend - E2E lifecycle pattern
---

# Frontend - E2E lifecycle pattern

Use this structure for `node:test` E2E suites to avoid premature process termination and flaky runs where only the first test file executes.

## Why this pattern exists

The anti-pattern is registering `after(...process.exit(...))` in shared `e2e/env.ts`.
When multiple files import the same env helper, a global process exit in teardown can stop the runner before later files execute.

## Recommended file structure

Create and keep these files together in each project:

- `e2e/env.ts` - lazy server startup (`getTestEnv`) + explicit disposer (`disposeTestEnv`)
- `e2e/withBrowser.ts` - per-test browser/context lifecycle
- `e2e/e2eSuite.ts` - per-file `describe` wrapper with final teardown
- `e2e/*.test.ts` - wrapped in one `e2eSuite(...)` each

## `env.ts` responsibilities

- start the test server once and memoize it with `envPromise`
- expose `disposeTestEnv()` that resets memoized state and disposes server
- keep startup failure `process.exit(1)` in `getTestEnv` catch block
- register `process.on('beforeExit', () => void disposeTestEnv())` as fallback cleanup
- do not register `after(...process.exit(...))` in this file

## `e2eSuite.ts` responsibilities

- define one suite-level wrapper for each test file
- call `disposeTestEnv()` in suite `after(...)`
- force final `process.exit(0)` only from this suite wrapper

Example:

```ts
import { after, describe } from 'node:test'
import { disposeTestEnv } from './env.js'

export function e2eSuite(name: string, define: () => void): void {
  describe(name, () => {
    after(async () => {
      await disposeTestEnv()
      process.exit(0)
    })
    define()
  })
}
```

## `*.test.ts` responsibilities

- import and use `e2eSuite`
- keep all file tests inside one wrapper

Example:

```ts
import test from 'node:test'
import { e2eSuite } from './e2eSuite.js'

e2eSuite('sign-in-email-code', () => {
  test('sign in with email code', async () => {
    // ...
  })
})
```

## `withBrowser.ts` responsibilities

- create and close browser context in `try/finally` for every test
- use `getTestEnv()` for shared server state

This keeps browser resources isolated per test while the backend is shared per suite.

## Running E2E

From project root, run with `fnm exec` so the correct Node version is used:

```bash
fnm exec -- npm run e2e
```
