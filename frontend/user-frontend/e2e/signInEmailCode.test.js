const app = require('@live-change/framework').app()
const randomProfile = require('random-profile-generator')

const randomUserData = randomProfile.profile()
randomUserData.email = randomUserData.firstName.toLowerCase() + '@test.com' // test domain - emails not sent

const happyPath = false

Feature('user')

Scenario('sign in with email code', async ({ I }) => {

  const user = app.generateUid()
  const email = randomUserData.email

  const User = await I.haveModel('user', 'User')
  const Email = await I.haveModel('email', 'Email')

  await User.create({ id: user, roles: [] })
  await Email.create({ id: email, email, user })

  I.amOnPage('/sign-in')
  I.fillField('input#email', email)
  I.click('button[type=submit]')

  I.seeInCurrentUrl('/sent/')
  const url = await I.grabCurrentUrl()
  const authentication = url.split('/').pop()

  const authenticationData = await I.grabObject('messageAuthentication', 'Authentication', authentication)
  console.log("AUTHENTICATION DATA", authenticationData)
  I.assert(!!authenticationData, true, 'authentication created')
  I.assert(authenticationData?.messageData?.user, user, 'authentication contains user')

  await I.useSecretCode(authentication, happyPath)

  I.seeInCurrentUrl('/sign-in-finished')
  const clientSession = await I.executeScript(() => api.client.value.session)
  const AuthenticatedUser = await I.haveModel('user', 'AuthenticatedUser')
  const authenticatedUserData = await AuthenticatedUser.get(clientSession)
  I.assert(!!authenticatedUserData, true, 'user authenticated server-side')
  const clientUser = await I.executeScript(() => api.client.value.user)
  console.log("CLIENT USER", clientUser)
  console.log("SERVER AUTHENTICATION", authenticatedUserData)
  I.assert(clientUser, authenticatedUserData.user, 'user authenticated')

  if(!happyPath) {
    I.amOnPage(url)
    I.seeInCurrentUrl('/sign-in-finished')
  }

})
