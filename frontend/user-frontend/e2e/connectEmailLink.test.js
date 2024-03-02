const app = require('@live-change/framework').app()
const randomProfile = require('random-profile-generator')

const email = randomProfile.profile().firstName.toLowerCase() + '@test.com' // test domain - emails not sent
const email2 = randomProfile.profile().firstName.toLowerCase() + '2@test.com' // test domain - emails not sent

const happyPath = false

Feature('user')

Scenario('sign in with email link', async ({ I }) => {

  const user = app.generateUid()

  const User = await I.haveModel('user', 'User')
  const Email = await I.haveModel('email', 'Email')
  const AuthenticatedUser = await I.haveModel('user', 'AuthenticatedUser')

  await User.create({ id: user, roles: [] })
  await Email.create({ id: email, email, user })
  I.amOnPage('/')
  const session = await I.executeScript(() => api.client.value.session)
  await AuthenticatedUser.create({ id: session, user, session })

  I.amOnPage('/connected')
  I.see(email)
  I.dontSee(email2)

  I.click('button#connect')

  I.seeInCurrentUrl('/connect')

  if(!happyPath) {
    I.fillField('input#email', email)
    I.click('button[type=submit]')
    I.see('')
  }

  I.fillField('input#email', email2)
  I.click('button[type=submit]')

  I.seeInCurrentUrl('/sent/')
  const url = await I.grabCurrentUrl()
  const authentication = url.split('/').pop()

  const authenticationData = await I.grabObject('messageAuthentication', 'Authentication', authentication)
  console.log("AUTHENTICATION DATA", authenticationData)
  I.assert(!!authenticationData, true, 'authentication created')
  I.assert(authenticationData?.messageData?.user, user, 'authentication contains user')

  const linkData = await I.useSecretLink(authentication, happyPath)

  I.seeInCurrentUrl('/connect-finished')

  if(!happyPath) {
    I.amOnPage('/link/' + linkData.secretCode)
    I.see('Link used')
  }

})
