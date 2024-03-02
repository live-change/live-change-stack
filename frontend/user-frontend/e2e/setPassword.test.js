const app = require('@live-change/framework').app()
const randomProfile = require('random-profile-generator')
const passwordGenerator = require('generate-password')

const name = randomProfile.profile().firstName.toLowerCase()
const email = name + '@test.com' // test domain - emails not sent

const happyPath = false

Feature('user')

Scenario('setPassword', async ({ I }) => {

  const user = app.generateUid()

  const User = await I.haveModel('user', 'User')
  const Email = await I.haveModel('email', 'Email')
  const AuthenticatedUser = await I.haveModel('user', 'AuthenticatedUser')
  const PasswordAuthentication = await I.haveModel('passwordAuthentication', 'PasswordAuthentication')

  await User.create({ id: user, roles: [] })
  await Email.create({ id: email, email, user })
  I.amOnPage('/')
  const session = await I.executeScript(() => api.client.value.session)
  await AuthenticatedUser.create({ id: session, user, session })

  await I.wait(0.2)
  const clientUser = await I.executeScript(() => api.client.value.user)
  I.assert(user, clientUser, 'client logged in')

  const emptyPasswordAuthenticationData = await PasswordAuthentication.get(user)
  I.assert(emptyPasswordAuthenticationData, null, 'password not set')

  I.amOnPage('/settings/change-password')
  I.see('Set password')

  const firstPassword = passwordGenerator.generate({
    length: 10,
    numbers: true
  })+(Math.random()*10).toFixed()
  I.fillField('input#newPassword', firstPassword)
  I.fillField('input#reenterPassword', firstPassword)
  I.click('button[type=submit]')

  I.seeInCurrentUrl('/settings/change-password-finished')

  await I.wait(0.2)
  const firstPasswordAuthenticationData = await PasswordAuthentication.get(user)
  I.assert(!!firstPasswordAuthenticationData, true, 'password set')

  I.amOnPage('/settings/change-password')
  I.see('Change password')

  const secondPassword = passwordGenerator.generate({
    length: 10,
    numbers: true
  })+(Math.random()*10).toFixed()

  I.fillField('input#currentPassword', firstPassword)
  I.fillField('input#newPassword', secondPassword)
  I.fillField('input#reenterPassword', secondPassword)
  I.click('button[type=submit]')

  await I.wait(0.2)
  const secondPasswordAuthenticationData = await PasswordAuthentication.get(user)
  I.assert(!!secondPasswordAuthenticationData, true, 'password set')
  I.assertNotEqual(secondPasswordAuthenticationData.passwordHash, firstPasswordAuthenticationData.passwordHash,
      'password changed')

})
