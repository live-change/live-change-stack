import { e2eSuite, test } from './e2eSuite.js'
import { waitForHydration } from '@live-change/e2e-test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import passwordGenerator from 'generate-password'
import { setPrimePasswordFieldValue } from './steps.js'
import { withBrowser } from './withBrowser.js'

const app = App.app()
const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com'

e2eSuite('setPassword', () => {
  test('set password', async () => {
  await withBrowser(async (page, env) => {
    const user = app.generateUid()
    const User = env.haveModel('user', 'User')
    const Email = env.haveModel('email', 'Email')
    const AuthenticatedUser = env.haveModel('user', 'AuthenticatedUser')
    const PasswordAuthentication = env.haveModel('passwordAuthentication', 'PasswordAuthentication')

    await User.create({ id: user, roles: [] })
    await Email.create({ id: email, email, user })
    await page.goto(env.url + '/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    const session = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { session: string } } } }).api.client.value.session
    )
    await AuthenticatedUser.create({ id: session, user, session })

    await page.reload({ waitUntil: 'networkidle' })
    await waitForHydration(page)
    const clientUser = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { user: string } } } }).api.client.value.user
    )
    assert.strictEqual(user, clientUser, 'client logged in')

    const emptyPasswordAuthenticationData = await PasswordAuthentication.get(user)
    assert.strictEqual(emptyPasswordAuthenticationData, null, 'password not set')

    await page.goto(env.url + '/user/settings/change-password', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.waitForSelector('#newPassword input', { state: 'visible', timeout: 20000 })

    const firstPassword =
      passwordGenerator.generate({ length: 10, numbers: true }) + (Math.random() * 10).toFixed()
    await setPrimePasswordFieldValue(page, '#newPassword', firstPassword)
    await setPrimePasswordFieldValue(page, '#reenterPassword', firstPassword)
    await Promise.all([
      page.waitForURL((u) => u.pathname.includes('/user/settings/change-password-finished'), { timeout: 20000 }),
      page.locator('button[type="submit"]').click()
    ])

    await new Promise((r) => setTimeout(r, 200))
    const firstPasswordAuthenticationData = await PasswordAuthentication.get(user)
    assert.ok(firstPasswordAuthenticationData, 'password set')

    await page.goto(env.url + '/user/settings/change-password', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.waitForSelector('#currentPassword input', { state: 'visible', timeout: 20000 })

    const secondPassword =
      passwordGenerator.generate({ length: 10, numbers: true }) + (Math.random() * 10).toFixed()
    await setPrimePasswordFieldValue(page, '#currentPassword', firstPassword)
    await setPrimePasswordFieldValue(page, '#newPassword', secondPassword)
    await setPrimePasswordFieldValue(page, '#reenterPassword', secondPassword)
    await page.locator('button[type="submit"]').click()

    await new Promise((r) => setTimeout(r, 200))
    const secondPasswordAuthenticationData = await PasswordAuthentication.get(user)
    assert.ok(secondPasswordAuthenticationData, 'password set')
    assert.notStrictEqual(
      (secondPasswordAuthenticationData as { passwordHash: string }).passwordHash,
      (firstPasswordAuthenticationData as { passwordHash: string }).passwordHash,
      'password changed'
    )
  })
  })
})
