const app = require('@live-change/framework').app()
const randomProfile = require('random-profile-generator')

const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com' // test domain - emails not sent
const email2 = name + '2@test.com' // test domain - emails not sent

const happyPath = false

Feature('user')

Scenario('disconnect email', async ({ I }) => {

  const user = app.generateUid()

  const User = await I.haveModel('user', 'User')
  const Email = await I.haveModel('email', 'Email')
  const AuthenticatedUser = await I.haveModel('user', 'AuthenticatedUser')

  await User.create({ id: user, roles: [] })
  await Email.create({ id: email, email, user })
  await Email.create({ id: email2, email: email2, user })
  I.amOnPage('/')
  const session = await I.executeScript(() => api.client.value.session)
  await AuthenticatedUser.create({ id: session, user, session })

  I.amOnPage('/connected')
  I.see(email)
  I.see(email2)

  I.click('span.pi-times') // delete button
  I.click('Yes')

  I.dontSee(email2)

  if(!happyPath) {
    I.dontSeeElement('span.pi-times') // delete button
    //I.click('Yes')
    //I.see(email)
  }

})
