const app = require('@live-change/framework').app()
const randomProfile = require('random-profile-generator')

const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com' // test domain - emails not sent

const happyPath = false

Feature('user')

Scenario('sign out', async ({ I }) => {

  const user = app.generateUid()

  const User = await I.haveModel('user', 'User')
  const Email = await I.haveModel('email', 'Email')
  const AuthenticatedUser = await I.haveModel('user', 'AuthenticatedUser')

  await User.create({ id: user, roles: [] })
  await Email.create({ id: email, email, user })
  I.amOnPage('/')
  const session = await I.executeScript(() => api.client.value.session)
  await AuthenticatedUser.create({ id: session, user, session })

  await I.wait(0.2)
  const clientUser = await I.executeScript(() => api.client.value.user)
  I.assert(user, clientUser, 'client logged in')

  I.amOnPage('/sign-out')
  I.seeInCurrentUrl('/sign-out-finished')

  await I.wait(1.0)
  const clientUser2 = await I.executeScript(() => api.client.value.user)
  console.log("CLIENT USER2", clientUser2)
  const authenticatedUserData = await AuthenticatedUser.get(session)
  console.log("AUTHENTICATED USER", authenticatedUserData)

  I.assert(!!authenticatedUserData, false, 'no server user')
  I.assert(!!clientUser2, false, 'no client user')

})
