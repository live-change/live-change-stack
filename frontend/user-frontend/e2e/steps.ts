import assert from 'node:assert'
import type { Page } from 'playwright'
import App from '@live-change/framework'
import randomProfile from 'random-profile-generator'
import passwordGenerator from 'generate-password'
import type { TestEnv } from './env.js'

const app = App.app()

export async function haveUser(
  env: TestEnv,
  name?: string,
  email?: string,
  password?: string,
  user: string = app.generateUid(),
  roles: string[] = []
): Promise<{ id: string; name: string; email: string; password: string }> {
  if (!password) password = passwordGenerator.generate({ length: 10, numbers: true })
  if (!name) name = randomProfile.profile().firstName
  if (!email) {
    name = name!
    email = name.split(' ')[0].toLowerCase() + (Math.random() * 100).toFixed() + '@test.com'
  }

  const PasswordAuthentication = env.haveModel('passwordAuthentication', 'PasswordAuthentication')
  const User = env.haveModel('user', 'User')
  const Email = env.haveModel('email', 'Email')
  const Identification = env.haveModel('userIdentification', 'Identification')

  const passwordHash = PasswordAuthentication.definition.properties.passwordHash.preFilter(password)
  await User.create({ id: user, roles })
  await PasswordAuthentication.create({ id: user, user, passwordHash })
  await Email.create({ id: email, email, user })
  await Identification.create({
    id: App.encodeIdentifier(['user_User', user]),
    sessionOrUserType: 'user_User',
    sessionOrUser: user,
    name: name!
  })
  return { id: user, name: name!, email, password }
}

export async function useEmailLink(
  page: Page,
  env: TestEnv,
  email: string,
  prefix = '/user/link/'
): Promise<{ authentication: unknown; link: { secretCode: string } }> {
  const MessageAuthentication = env.haveModel('messageAuthentication', 'Authentication') as {
    indexObjectGet: (index: string, key: unknown[], opts?: { reverse?: boolean; limit?: number }) => Promise<unknown>
  }
  const authentication = await MessageAuthentication.indexObjectGet('byContact', ['email', email], {
    reverse: true,
    limit: 1
  })
  const Link = env.haveModel('secretLink', 'Link') as {
    indexObjectGet: (index: string, key: unknown) => Promise<{ secretCode: string }>
  }
  const link = await Link.indexObjectGet('byAuthentication', authentication)
  await page.goto(env.url + prefix + link.secretCode, { waitUntil: 'networkidle' })
  await new Promise((r) => setTimeout(r, 100))
  return { authentication, link }
}

export async function amLoggedIn(page: Page, env: TestEnv, user: { id: string }): Promise<void> {
  const AuthenticatedUser = env.haveModel('user', 'AuthenticatedUser')
  const session = await page.evaluate(() => (window as unknown as { api: { client: { value: { session: string } } } }).api.client.value.session)
  await AuthenticatedUser.create({ id: session, session, user: user.id })
}

export async function amLoggedOut(page: Page, env: TestEnv): Promise<void> {
  const AuthenticatedUser = env.haveModel('user', 'AuthenticatedUser')
  const session = await page.evaluate(() => (window as unknown as { api: { client: { value: { session: string } } } }).api.client.value.session)
  await AuthenticatedUser.delete(session)
}

export async function useSecretCode(
  page: Page,
  env: TestEnv,
  authentication: unknown,
  happyPath: boolean
): Promise<void> {
  const Code = env.haveModel('secretCode', 'Code') as {
    indexObjectGet: (index: string, key: unknown) => Promise<{ id: string; secretCode: string; expire: Date }>
    indexRangeGet: (index: string, key: unknown) => Promise<{ id: string; secretCode: string; expire: Date }[]>
    update: (id: string, data: { expire: Date }) => Promise<unknown>
  }
  let codeData = await Code.indexObjectGet('byAuthentication', authentication)
  assert.ok(codeData, 'code created')

  if (!happyPath) {
    await sleep(200)
    await page.waitForSelector('input#code', { state: 'visible' })
    const wrongCode = codeData!.secretCode === '123456' ? '654321' : '123456'
    await page.fill('input#code', wrongCode)
    await page.fill('input#code', wrongCode)
    await page.click('button[type=submit]')
    // PrimeVue 4 uses <Message> with role=\"alert\" instead of a #code-help.p-error span
    await page.getByRole('alert').waitFor({ state: 'visible' })
  }

  if (!happyPath) {
    await sleep(200)
    await page.waitForSelector('input#code', { state: 'visible' })
    await Code.update(codeData!.id, { expire: new Date() })
    await page.fill('input#code', codeData!.secretCode)
    await page.fill('input#code', codeData!.secretCode)
    await page.click('button[type=submit]')
    await page.getByRole('alert').waitFor({ state: 'visible' })

    await page.click('text=Resend')
    assert.ok(page.url().includes('/sent/'))

    await new Promise((r) => setTimeout(r, 200))
    const newCodeData = await Code.indexRangeGet('byAuthentication', authentication)
    newCodeData.sort((a, b) => new Date(b.expire).getTime() - new Date(a.expire).getTime())
    const oldCodeData = codeData
    codeData = newCodeData[0]
    assert.ok(codeData, 'code exists')
    assert.notStrictEqual(oldCodeData!.id, codeData!.id, 'code is different from previous code')
  }

  await page.waitForFunction(() => {
    const input = document.querySelector('input#code') as HTMLInputElement
    if(!input) return false
    return input.value === ''
  })
  await page.fill('input#code', codeData!.secretCode)
  await page.fill('input#code', codeData!.secretCode)
  await page.click('button[type=submit]')
  await new Promise((r) => setTimeout(r, 100))
}

export async function useSecretLink(
  page: Page,
  env: TestEnv,
  authentication: unknown,
  happyPath: boolean,
  prefix = '/user'
): Promise<{ secretCode: string }> {
  const Link = env.haveModel('secretLink', 'Link') as {
    indexObjectGet: (index: string, key: unknown) => Promise<{ id: string; secretCode: string; expire: Date }>
    indexRangeGet: (index: string, key: unknown) => Promise<{ id: string; secretCode: string; expire: Date }[]>
    update: (id: string, data: { expire: Date }) => Promise<unknown>
  }
  let linkData = await Link.indexObjectGet('byAuthentication', authentication)
  assert.ok(linkData, 'link created')

  if (!happyPath) {
    await page.goto(env.url + prefix + '/link/[badSecret]', { waitUntil: 'networkidle' })
    await page.getByText('Unknown link').waitFor({ state: 'visible' })
  }

  if (!happyPath) {
    await new Promise((r) => setTimeout(r, 200))
    await Link.update(linkData!.id, { expire: new Date() })
    await page.goto(env.url + prefix + '/link/' + linkData!.secretCode, { waitUntil: 'networkidle' })
    await page.getByText('Link expired').waitFor({ state: 'visible' })

    await page.click('text=Resend')
    assert.ok(page.url().includes(prefix + '/sent/'))

    await new Promise((r) => setTimeout(r, 200))
    const newLinksData = await Link.indexRangeGet('byAuthentication', authentication)
    newLinksData.sort((a, b) => new Date(b.expire).getTime() - new Date(a.expire).getTime())
    const oldLinkData = linkData
    linkData = newLinksData[0]
    assert.ok(linkData, 'link exists')
    assert.notStrictEqual(oldLinkData!.id, linkData!.id, 'link is different from previous link')
  }

  await page.goto(env.url + prefix + '/link/' + linkData!.secretCode, { waitUntil: 'networkidle' })
  await new Promise((r) => setTimeout(r, 100))
  return linkData!
}

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}