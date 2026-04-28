import App from '@live-change/framework'
import passwordGenerator from 'generate-password'
import type { Page } from 'playwright'
import randomProfile from 'random-profile-generator'

const app = App.app()

type TestEnvWithModels = {
  url: string
  haveModel: (serviceName: string, modelName: string) => any
}

export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const root = document.querySelector('#app') ?? document.body
      if(!root) return false
      const vueApp = (root as HTMLElement & { __vue_app__?: unknown }).__vue_app__
      const apiVal = (window as unknown as { api?: { client?: { value?: unknown } } }).api?.client?.value
      return !!(vueApp && apiVal)
    },
    { timeout: 15000 }
  )
}

export async function createUser(
  env: TestEnvWithModels,
  name?: string,
  email?: string,
  password?: string,
  user: string = app.generateUid(),
  roles: string[] = ['writer', 'member']
): Promise<{ id: string, name: string, email: string, password: string }> {
  if(!password) password = passwordGenerator.generate({ length: 10, numbers: true })
  if(!name) name = randomProfile.profile().firstName
  if(!email) {
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

export async function loginAsUser(
  page: Page,
  env: TestEnvWithModels,
  user: { id: string }
): Promise<void> {
  const AuthenticatedUser = env.haveModel('user', 'AuthenticatedUser')
  const session = await page.evaluate(() => {
    const api = (window as unknown as { api: { client: { value: { session: string } } } }).api
    return api.client.value.session
  })
  await AuthenticatedUser.create({ id: session, session, user: user.id })
}

export async function logOut(page: Page, env: TestEnvWithModels): Promise<void> {
  const AuthenticatedUser = env.haveModel('user', 'AuthenticatedUser')
  const session = await page.evaluate(() => {
    const api = (window as unknown as { api: { client: { value: { session: string } } } }).api
    return api.client.value.session
  })
  await AuthenticatedUser.delete(session)
}

export async function loginAsNewUserWithRoles(
  page: Page,
  env: TestEnvWithModels,
  roles: string[] = ['writer', 'member']
): Promise<{ id: string, name: string, email: string, password: string }> {
  const user = await createUser(env, undefined, undefined, undefined, undefined, roles)
  await page.goto(env.url, { waitUntil: 'load' })
  await waitForHydration(page)
  await loginAsUser(page, env, user)
  await page.reload({ waitUntil: 'load' })
  await waitForHydration(page)
  return user
}

export async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}
