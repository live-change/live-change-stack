import test from 'node:test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import passwordGenerator from 'generate-password'
import { withBrowser } from './withBrowser.js'

const app = App.app()
const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com'

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
    const session = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { session: string } } } }).api.client.value.session
    )
    await AuthenticatedUser.create({ id: session, user, session })

    await page.reload({ waitUntil: 'networkidle' })
    const clientUser = await page.evaluate(
      () => (window as unknown as { api: { client: { value: { user: string } } } }).api.client.value.user
    )
    assert.strictEqual(user, clientUser, 'client logged in')

    const emptyPasswordAuthenticationData = await PasswordAuthentication.get(user)
    assert.strictEqual(emptyPasswordAuthenticationData, null, 'password not set')

    await page.goto(env.url + '/user/settings/change-password', { waitUntil: 'networkidle' })
    await page.getByText('Set password').waitFor({ state: 'visible' })

    const firstPassword =
      passwordGenerator.generate({ length: 10, numbers: true }) + (Math.random() * 10).toFixed()
    await page.locator('input[type="password"]').nth(0).fill(firstPassword)
    await page.locator('input[type="password"]').nth(1).fill(firstPassword)
    await page.click('button[type=submit]')
    assert.ok(page.url().includes('/user/settings/change-password-finished'))

    await new Promise((r) => setTimeout(r, 200))
    const firstPasswordAuthenticationData = await PasswordAuthentication.get(user)
    assert.ok(firstPasswordAuthenticationData, 'password set')

    await page.goto(env.url + '/user/settings/change-password', { waitUntil: 'networkidle' })
    await page.getByText('Change password').waitFor({ state: 'visible' })

    const secondPassword =
      passwordGenerator.generate({ length: 10, numbers: true }) + (Math.random() * 10).toFixed()
    await page.locator('input[type="password"]').nth(0).fill(firstPassword)
    await page.locator('input[type="password"]').nth(1).fill(secondPassword)
    await page.locator('input[type="password"]').nth(2).fill(secondPassword)
    await page.click('button[type=submit]')

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
