const randomProfile = require('random-profile-generator')

const user = randomProfile.profile()
user.email = user.firstName.toLowerCase() + '@test.com' // test domain - emails not sent

const happyPath = false

Feature('user')

Scenario('sign up with email code', async ({ I }) => {

  I.amOnPage('/sign-up')
  I.fillField('input#email', user.email)
  I.click('button[type=submit]')

  I.seeInCurrentUrl('/sent/')
  const url = await I.grabCurrentUrl()
  const authentication = url.split('/').pop()

  const authenticationData = await I.grabObject('messageAuthentication', 'Authentication', authentication)
  console.log("AUTHENTICATION DATA", authenticationData)
  I.assert(!!authenticationData, true, 'authentication created')

  await I.useSecretCode(authentication, happyPath)

  I.seeInCurrentUrl('/sign-up-finished')
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
    I.seeInCurrentUrl('/sign-up-finished')
  }

})
