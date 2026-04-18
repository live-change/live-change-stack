import test from 'node:test'
import assert from 'node:assert'
import { withBrowser } from './withBrowser.js'
import { e2eSuite } from './e2eSuite.js'

e2eSuite('homepage', () => {
  test('homepage responds and renders html', async () => {
    await withBrowser(async (page, env) => {
      const response = await page.goto(env.url + '/', { waitUntil: 'networkidle' })
      assert.ok(response, 'navigation returned response')
      assert.ok(response!.ok(), 'homepage responds with success status')

      const html = await page.content()
      assert.ok(html.includes('<html'), 'page content contains html tag')
    })
  })
})
