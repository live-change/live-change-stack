import assert from 'node:assert'
import { e2eSuite, test } from '@live-change/e2e-test'
import { withBrowser } from './withBrowser.js'

e2eSuite('client-session', () => {
  test('frontend initializes api client session', async () => {
    await withBrowser(async (page, env) => {
      await page.goto(env.url + '/', { waitUntil: 'networkidle' })
      const session = await page.evaluate(() => {
        const root = window as unknown as { api?: { client?: { value?: { session?: string } } } }
        return root.api?.client?.value?.session
      })
      assert.ok(typeof session === 'string' && session.length > 0, 'session id is present')
    })
  })
})
