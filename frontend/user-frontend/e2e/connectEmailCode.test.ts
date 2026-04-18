import test from 'node:test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import { withBrowser } from './withBrowser.js'
import { useSecretCode, sleep } from './steps.js'
import { e2eSuite } from './e2eSuite.js'

const app = App.app()
const email = randomProfile.profile().firstName.toLowerCase() + '@test.com'
const email2 = randomProfile.profile().firstName.toLowerCase() + '2@test.com'
const happyPath = false

e2eSuite('connectEmailCode', () => {
  test('connect email with code', async () => {
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

    // Reload so client gets user from server; otherwise router redirects to sign-in when opening /user/settings/connected
    await page.reload({ waitUntil: 'networkidle' })
    await page.goto(env.url + '/user/settings/connected', { waitUntil: 'networkidle' })
    await page.getByText(email).waitFor({ state: 'visible', timeout: 15000 })
    assert.strictEqual(await page.getByText(email2).isVisible(), false, 'email2 should not be visible')

    await page.click('button#connect')
    assert.ok(page.url().includes('/connect'))

    if (!happyPath) {
      await page.fill('input#email', email)
      await page.click('button[type=submit]')
      assert.ok(page.url().includes('/connect'))
    }

    await page.fill('input#email', email2)
    await page.click('button[type=submit]')
    await page.waitForURL('**/sent/*', { timeout: 10000 })
    assert.ok(page.url().includes('/sent/'))

    const url = page.url()
    const authentication = url.split('/').pop()!

    const authenticationData = await env.grabObject('messageAuthentication', 'Authentication', authentication)
    assert.ok(authenticationData, 'authentication created')
    assert.strictEqual((authenticationData as { messageData?: { user: string } })?.messageData?.user, user, 'authentication contains user')

    await useSecretCode(page, env, authentication, happyPath)
    await page.waitForURL('**/connect-finished', { timeout: 10000 })
    assert.ok(page.url().includes('/connect-finished'))

    if (!happyPath) {
      await page.goto(url, { waitUntil: 'networkidle' })
      assert.ok(page.url().includes('/connect-finished'))
    }
  })
  })
})
