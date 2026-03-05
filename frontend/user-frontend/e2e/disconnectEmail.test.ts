import test from 'node:test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import { withBrowser } from './withBrowser.js'

const app = App.app()
const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com'
const email2 = name + '2@test.com'
const happyPath = false

test('disconnect email', async () => {
  await withBrowser(async (page, env) => {
    const user = app.generateUid()

    const User = env.haveModel('user', 'User')
    const Email = env.haveModel('email', 'Email')
    const AuthenticatedUser = env.haveModel('user', 'AuthenticatedUser')

    await User.create({ id: user, roles: [] })
    await Email.create({ id: email, email, user })
    await Email.create({ id: email2, email: email2, user })
    await page.goto(env.url + '/', { waitUntil: 'networkidle' })
    const session = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { session: string } } } }).api.client.value.session
    )
    await AuthenticatedUser.create({ id: session, user, session })

    await page.reload({ waitUntil: 'networkidle' })
    await page.goto(env.url + '/user/settings/connected', { waitUntil: 'networkidle' })
    await page.getByText(email).waitFor({ state: 'visible' })
    await page.getByText(email2).waitFor({ state: 'visible' })

    await page.click('span.pi-times')
    await page.click('text=Yes')
    assert.strictEqual(await page.getByText(email2).isVisible(), false, 'email2 should not be visible')

    if (!happyPath) {
      await page.locator('span.pi-times').waitFor({ state: 'hidden' })
    }
  })
})
