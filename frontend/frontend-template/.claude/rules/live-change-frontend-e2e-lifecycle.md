---
description: Stable node:test E2E lifecycle with env, withBrowser and e2eSuite
globs: **/e2e/**/*.{js,ts}
---

# Frontend E2E lifecycle

Use this pattern in LiveChange E2E tests based on `node:test`.

## Required files

- `e2e/env.ts` with `getTestEnv()` and `disposeTestEnv()`
- `e2e/withBrowser.ts` that closes context/browser in `finally`
- `e2e/e2eSuite.ts` that wraps each test file in `describe(...)` + `after(...)`
- `e2e/*.test.ts` wrapped in exactly one `e2eSuite(...)`

## Teardown rule

- Never register `after(...process.exit(...))` inside shared `e2e/env.ts`.
- Register final `process.exit(0)` only in `e2eSuite.ts` after calling `disposeTestEnv()`.
- Keep startup failure `process.exit(1)` in `getTestEnv()` catch block.

## Minimal suite wrapper

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

## Running commands

When running E2E commands, use `fnm exec -- ...` so Node matches `.node-version` / `.nvmrc`.
