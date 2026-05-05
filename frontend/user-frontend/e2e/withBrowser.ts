import { createWithBrowser } from '@live-change/e2e-test'
import { getTestEnv } from './env.js'
import type { TestEnv } from './env.js'

export const withBrowser = createWithBrowser<TestEnv>(getTestEnv)
