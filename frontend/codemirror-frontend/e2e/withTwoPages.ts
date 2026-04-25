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

export async function withTwoPages(
  fn: (pageA: Page, pageB: Page, env: TestEnv) => Promise<void>
): Promise<void> {
  const env = await getTestEnv()
  const browser = await chromium.launch({ headless: process.env.SHOW_BROWSER ? false : true })
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()
  const pageA = await contextA.newPage()
  const pageB = await contextB.newPage()
  attachPageDebug(pageA)
  attachPageDebug(pageB)
  try {
    await fn(pageA, pageB, env)
  } finally {
    await contextA.close()
    await contextB.close()
    await browser.close()
  }
}
