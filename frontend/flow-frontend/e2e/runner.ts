import { createRunner } from '@live-change/e2e-test'
import { disposeTestEnv, getTestEnv } from './env.js'

const runner = createRunner({
  setupEnv: getTestEnv,
  teardownEnv: disposeTestEnv
})

export const runE2E = runner.runE2E
await runner.runCli(import.meta.url, process.argv.slice(2))
