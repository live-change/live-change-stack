import test from 'node:test'
import assert from 'node:assert'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import passwordGenerator from 'generate-password'
import { withBrowser } from './withBrowser.js'
import { useSecretCode } from './steps.js'

const app = App.app()
const email = randomProfile.profile().firstName.toLowerCase() + '@test.com'

test('reset password with email code', async () => {
  await withBrowser(async (page, env) => {
    const user = app.generateUid()

    const User = env.haveModel('user', 'User')
    const Email = env.haveModel('email', 'Email')

    await User.create({ id: user, roles: [] })
    await Email.create({ id: email, email, user })
    await page.goto(env.url + '/', { waitUntil: 'networkidle' })

    await page.goto(env.url + '/user/reset-password', { waitUntil: 'networkidle' })
    await page.fill('input#email', email)
    await page.click('button[type=submit]')
    await page.waitForURL('**/sent/*', { timeout: 10000 })

    assert.ok(page.url().includes('/sent'))
    let url = page.url()
    const authentication = url.split('/').pop()!

    const authenticationData = await env.grabObject('messageAuthentication', 'Authentication', authentication)
    assert.ok(authenticationData, 'authentication created')
    assert.strictEqual((authenticationData as { messageData?: { user: string } })?.messageData?.user, user, 'authentication message data contains user')
    assert.strictEqual((authenticationData as { actionProperties?: { user: string } })?.actionProperties?.user, user, 'authentication action properties contains user')

    await useSecretCode(page, env, authentication, false)
    await page.waitForURL('**/set-new-password/*', { timeout: 10000 })

    assert.ok(page.url().includes('/set-new-password/'))
    url = page.url()
    const resetPasswordAuthentication = url.split('/').pop()!
    await new Promise((r) => setTimeout(r, 100))
    const ResetPasswordAuthentication = env.haveModel('passwordAuthentication', 'ResetPasswordAuthentication') as {
      indexObjectGet: (index: string, key: string) => Promise<unknown>
    }
    const resetPasswordAuthenticationData = await ResetPasswordAuthentication.indexObjectGet('byKey', resetPasswordAuthentication)
    assert.ok(resetPasswordAuthenticationData, 'reset password authentication created')

    await page.getByText('Reset password').waitFor({ state: 'visible' })

    const password =
      passwordGenerator.generate({ length: 10, numbers: true }) + (Math.random() * 10).toFixed()
    await page.locator('input[type="password"]').nth(0).fill(password)
    await page.locator('input[type="password"]').nth(1).fill(password)
    await page.click('button[type=submit]')
    await page.waitForURL('**/reset-password-finished', { timeout: 10000 })
    assert.ok(page.url().includes('/reset-password-finished'))
  })
})
