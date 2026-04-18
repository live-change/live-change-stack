import { chromium } from 'playwright'
import { getTestEnv } from './env.js'
import type { TestEnv } from './env.js'
import type { Page } from 'playwright'

export async function withBrowser(
  fn: (page: Page, env: TestEnv) => Promise<void>
): Promise<void> {
  const env = await getTestEnv()
  const browser = await chromium.launch({ headless: process.env.SHOW_BROWSER ? false : true })
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await fn(page, env)
  } finally {
    await context.close()
    await browser.close()
  }
}
