import test from 'node:test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import { withBrowser } from './withBrowser.js'
import { useSecretLink } from './steps.js'
import { e2eSuite } from './e2eSuite.js'

const app = App.app()
const randomUserData = randomProfile.profile()
;(randomUserData as { email?: string }).email =
  (randomUserData as { firstName: string }).firstName.toLowerCase() + '@test.com'
const happyPath = false

e2eSuite('signInEmailLink', () => {
  test('sign in with email link', async () => {
  await withBrowser(async (page, env) => {
    const user = app.generateUid()
    const email = (randomUserData as { email: string }).email

    const User = env.haveModel('user', 'User')
    const Email = env.haveModel('email', 'Email')

    await User.create({ id: user, roles: [] })
    await Email.create({ id: email, email, user })

    await page.goto(env.url + '/user/sign-in-email', { waitUntil: 'networkidle' })
    await page.fill('input#email', email)
    await page.click('button[type=submit]')
    await page.waitForURL('**/sent/*', { timeout: 10000 })

    assert.ok(page.url().includes('/sent/'))
    const url = page.url()
    const authentication = url.split('/').pop()!

    const authenticationData = await env.grabObject('messageAuthentication', 'Authentication', authentication)
    assert.ok(authenticationData, 'authentication created')
    assert.strictEqual((authenticationData as { messageData?: { user: string } })?.messageData?.user, user, 'authentication contains user')

    const linkData = await useSecretLink(page, env, authentication, happyPath)
    await page.waitForURL('**/sign-in-finished', { timeout: 10000 })

    assert.ok(page.url().includes('/user/sign-in-finished'))
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
      await page.goto(env.url + '/user/link/' + linkData.secretCode, { waitUntil: 'networkidle' })
      await page.getByText('Link used').waitFor({ state: 'visible' })
    }
  })
  })
})
