const app = require('@live-change/framework').app()
const randomProfile = require('random-profile-generator')

const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com' // test domain - emails not sent

const happyPath = false

Feature('user')

Scenario('delete account', async ({ I }) => {

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

  I.amOnPage('/delete')
  I.click('.p-checkbox-box')
  I.click('button#delete')

  I.seeInCurrentUrl('/delete-finished')

  await I.wait(0.3)
  const clientUserAfterDelete = await I.executeScript(() => api.client.value.user)
  I.assert(!!clientUserAfterDelete, false, 'user logged out')

  const deletedUser = await User.get(user)
  I.assert(!!deletedUser, false, 'user deleted')

  const deletedEmail = await Email.get(email)
  I.assert(!!deletedEmail, false, 'email deleted')
})
