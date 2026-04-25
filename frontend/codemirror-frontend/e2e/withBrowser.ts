import { chromium } from 'playwright'
import type { Page } from 'playwright'
import { getTestEnv, type TestEnv } from './env.js'

function attachPageDebug(page: Page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[browser console]', msg.text())
  })
  page.on('pageerror', (err) => {
    console.error('[browser pageerror]', err.stack)
  })
}

export async function withBrowser(
  fn: (page: Page, env: TestEnv) => Promise<void>
): Promise<void> {
  const env = await getTestEnv()
  const browser = await chromium.launch({ headless: process.env.SHOW_BROWSER ? false : true })
  const context = await browser.newContext()
  const page = await context.newPage()
  attachPageDebug(page)
  try {
    await fn(page, env)
  } finally {
    await context.close()
    await browser.close()
  }
}
