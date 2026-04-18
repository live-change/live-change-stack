---
name: live-change-frontend-e2e-lifecycle
description: Set up stable node:test E2E lifecycle with env, withBrowser and e2eSuite
---

# Skill: live-change-frontend-e2e-lifecycle

Use this skill when creating or refactoring LiveChange frontend E2E tests.

## Goal

Avoid flaky teardown where only the first test file runs because shared env teardown calls `process.exit`.

## Step 1 - Build shared env helper

Create `e2e/env.ts` with:

- `getTestEnv()` that starts `TestServer` once and memoizes with `envPromise`
- `disposeTestEnv()` that resets memoized state and disposes server
- fallback cleanup:

```ts
process.on('beforeExit', () => {
  void disposeTestEnv()
})
```

Keep startup failure `process.exit(1)` inside `getTestEnv()` catch.

Do not add `after(...process.exit(...))` to this file.

## Step 2 - Isolate browser per test

Create `e2e/withBrowser.ts` with Playwright setup/teardown in `try/finally`:

- call `getTestEnv()` once per test execution
- open browser/context/page
- close context and browser in `finally`

## Step 3 - Add suite-level teardown

Create `e2e/e2eSuite.ts`:

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

## Step 4 - Wrap tests

Each `e2e/*.test.ts` file should use one wrapper:

```ts
import test from 'node:test'
import { e2eSuite } from './e2eSuite.js'

e2eSuite('example-suite', () => {
  test('renders page', async () => {
    // test body
  })
})
```

## Step 5 - Verify

Run from project root with `fnm exec`:

```bash
fnm exec -- npm run e2e
```

Confirm multiple test files execute and process exits only after full suite teardown.
