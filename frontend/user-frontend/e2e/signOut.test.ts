import test from 'node:test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import { withBrowser } from './withBrowser.js'
import { e2eSuite } from './e2eSuite.js'

const app = App.app()
const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com'

e2eSuite('signOut', () => {
  test('sign out', async () => {
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

    await page.goto(env.url + '/user/sign-out', { waitUntil: 'networkidle' })
    await page.waitForURL('**/sign-out-finished', { timeout: 10000 })
    assert.ok(page.url().includes('/user/sign-out-finished'))

    await new Promise((r) => setTimeout(r, 1000))
    const clientUser2 = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { user: unknown } } } }).api.client.value.user
    )
    const authenticatedUserData = await AuthenticatedUser.get(session)

    assert.strictEqual(!!authenticatedUserData, false, 'no server user')
    assert.strictEqual(!!clientUser2, false, 'no client user')
  })
  })
})
