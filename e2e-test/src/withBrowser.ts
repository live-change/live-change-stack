import { chromium } from 'playwright'
import type { Page } from 'playwright'

export function createWithBrowser<TEnv>(getTestEnv: () => Promise<TEnv>) {
  return async function withBrowser(
    fn: (page: Page, env: TEnv) => Promise<void>
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
}
