const app = require('@live-change/framework').app()
const randomProfile = require('random-profile-generator')
const crypto = require('crypto')
const passwordGenerator = require('generate-password')

const randomUserData = randomProfile.profile()
randomUserData.email = randomUserData.firstName.toLowerCase() + '@test.com' // test domain - emails not sent

const happyPath = false

Feature('user')

Scenario('sign in with email and password', async ({ I }) => {

  const user = app.generateUid()
  const email = randomUserData.email
  const password = passwordGenerator.generate({
    length: 10,
    numbers: true
  })+(Math.random()*10).toFixed()
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

  const User = await I.haveModel('user', 'User')
  const Email = await I.haveModel('email', 'Email')
  const PasswordAuthentication = await I.haveModel('passwordAuthentication', 'PasswordAuthentication')

  await User.create({ id: user, roles: [] })
  await Email.create({ id: email, email, user })
  await PasswordAuthentication.create({ id: user, user, passwordHash })

  I.amOnPage('/sign-in')
  I.fillField('input#email', email)
  I.fillField('input#password', password)
  I.click('button[type=submit]')

  I.seeInCurrentUrl('/sign-in-finished')
  await I.wait(0.2)
  const clientSession = await I.executeScript(() => api.client.value.session)
  const AuthenticatedUser = await I.haveModel('user', 'AuthenticatedUser')
  const authenticatedUserData = await AuthenticatedUser.get(clientSession)
  I.assert(!!authenticatedUserData, true, 'user authenticated server-side')
  const clientUser = await I.executeScript(() => api.client.value.user)
  console.log("CLIENT USER", clientUser)
  console.log("SERVER AUTHENTICATION", authenticatedUserData)
  I.assert(clientUser, authenticatedUserData.user, 'user authenticated')

})
