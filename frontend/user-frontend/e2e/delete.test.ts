import test from 'node:test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import { withBrowser } from './withBrowser.js'
import { e2eSuite } from './e2eSuite.js'

const app = App.app()
const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com'

e2eSuite('delete', () => {
  test('delete account', async () => {
  await withBrowser(async (page, env) => {
    const user = app.generateUid()

    const User = env.haveModel('user', 'User')
    const Email = env.haveModel('email', 'Email')
    const AuthenticatedUser = env.haveModel('user', 'AuthenticatedUser')

    await User.create({ id: user, roles: [] })
    await Email.create({ id: email, email, user })
    await page.goto(env.url + '/', { waitUntil: 'networkidle' })
    const session = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { session: string } } } }).api.client.value.session
    )
    await AuthenticatedUser.create({ id: session, user, session })

    await page.reload({ waitUntil: 'networkidle' })
    const clientUser = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { user: string } } } }).api.client.value.user
    )
    assert.strictEqual(user, clientUser, 'client logged in')

    await page.goto(env.url + '/user/settings/delete', { waitUntil: 'networkidle' })
    await page.click('.p-checkbox-box')
    await page.click('button#delete')
    await page.waitForURL('**/delete-finished', { timeout: 10000 })

    assert.ok(page.url().includes('/delete-finished'))

    await new Promise((r) => setTimeout(r, 300))
    const clientUserAfterDelete = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { user: unknown } } } }).api.client.value.user
    )
    assert.strictEqual(!!clientUserAfterDelete, false, 'user logged out')

    const deletedUser = await User.get(user)
    assert.strictEqual(!!deletedUser, false, 'user deleted')

    const deletedEmail = await Email.get(email)
    assert.strictEqual(!!deletedEmail, false, 'email deleted')
  })
  })
})
