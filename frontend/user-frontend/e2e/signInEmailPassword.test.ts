import test from 'node:test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import crypto from 'crypto'
import passwordGenerator from 'generate-password'
import { withBrowser } from './withBrowser.js'
import { e2eSuite } from './e2eSuite.js'

const app = App.app()
const randomUserData = randomProfile.profile()
;(randomUserData as { email?: string }).email =
  (randomUserData as { firstName: string }).firstName.toLowerCase() + '@test.com'

e2eSuite('signInEmailPassword', () => {
  test('sign in with email and password', async () => {
  await withBrowser(async (page, env) => {
    const user = app.generateUid()
    const email = (randomUserData as { email: string }).email
    const password =
      passwordGenerator.generate({ length: 10, numbers: true }) + (Math.random() * 10).toFixed()
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

    const User = env.haveModel('user', 'User')
    const Email = env.haveModel('email', 'Email')
    const PasswordAuthentication = env.haveModel('passwordAuthentication', 'PasswordAuthentication')

    await User.create({ id: user, roles: [] })
    await Email.create({ id: email, email, user })
    await PasswordAuthentication.create({ id: user, user, passwordHash })

    await page.goto(env.url + '/user/sign-in-email', { waitUntil: 'networkidle' })
    await page.fill('input#email', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type=submit]')
    await page.waitForURL('**/sign-in-finished', { timeout: 10000 })

    assert.ok(page.url().includes('/user/sign-in-finished'))
    await new Promise((r) => setTimeout(r, 200))

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
  })
  })
})
