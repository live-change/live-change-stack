import { e2eSuite, test } from './e2eSuite.js'
import { waitForHydration } from '@live-change/e2e-test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import { withBrowser } from './withBrowser.js'

const app = App.app()
const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com'
const email2 = name + '2@test.com'

e2eSuite('disconnectEmail', () => {
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
    await waitForHydration(page)
    const session = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { session: string } } } }).api.client.value.session
    )
    await AuthenticatedUser.create({ id: session, user, session })

    await page.reload({ waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.goto(env.url + '/user/settings/connected', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.getByText(email, { exact: true }).waitFor({ state: 'visible' })
    await page.getByText(email2, { exact: true }).waitFor({ state: 'visible' })

    await page.locator('li').filter({ hasText: email }).locator('button.p-button-rounded').click()
    await page.locator('[role="alertdialog"] button.p-button-danger').last().click({ force: true })
    assert.strictEqual(await page.getByText(email, { exact: true }).isVisible(), false, 'disconnected email should be gone')
    assert.strictEqual(await page.getByText(email2, { exact: true }).isVisible(), true, 'other email should remain')
  })
  })
})
