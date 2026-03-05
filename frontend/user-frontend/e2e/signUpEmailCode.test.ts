import test from 'node:test'
import assert from 'node:assert'
import randomProfile from 'random-profile-generator'
import { withBrowser } from './withBrowser.js'
import { useSecretCode } from './steps.js'

const user = randomProfile.profile()
;(user as { email?: string }).email =
  (user as { firstName: string }).firstName.toLowerCase() + '@test.com'
const happyPath = false

test('sign up with email code', async () => {
  await withBrowser(async (page, env) => {
    await page.goto(env.url + '/user/sign-up-email', { waitUntil: 'networkidle' })
    await page.fill('input#email', (user as { email: string }).email)
    await page.click('button[type=submit]')
    await page.waitForURL('**/sent/*', { timeout: 10000 })

    assert.ok(page.url().includes('/sent/'))
    const url = page.url()
    const authentication = url.split('/').pop()!

    const authenticationData = await env.grabObject('messageAuthentication', 'Authentication', authentication)
    assert.ok(authenticationData, 'authentication created')

    await useSecretCode(page, env, authentication, happyPath)
    await page.waitForURL('**/sign-up-finished', { timeout: 10000 })

    assert.ok(page.url().includes('/user/sign-up-finished'))
    const clientSession = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { session: string } } } }).api.client.value.session
    )
    const AuthenticatedUser = env.haveModel('user', 'AuthenticatedUser')
    const authenticatedUserData = await AuthenticatedUser.get(clientSession)
    assert.ok(authenticatedUserData, 'user authenticated server-side')
    const clientUser = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { user: string } } } }).api.client.value.user
    )
    assert.strictEqual(clientUser, (authenticatedUserData as { user: string }).user, 'user authenticated')

    if (!happyPath) {
      await page.goto(url, { waitUntil: 'networkidle' })
      assert.ok(page.url().includes('/user/sign-up-finished'))
    }
  })
})
