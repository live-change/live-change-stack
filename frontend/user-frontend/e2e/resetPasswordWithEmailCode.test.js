const app = require('@live-change/framework').app()
const randomProfile = require('random-profile-generator')
const passwordGenerator = require('generate-password')

const email = randomProfile.profile().firstName.toLowerCase() + '@test.com' // test domain - emails not sent
const email2 = randomProfile.profile().firstName.toLowerCase() + '2@test.com' // test domain - emails not sent

const happyPath = false

Feature('user')

Scenario('reset password with email code', async ({ I }) => {

  const user = app.generateUid()

  const User = await I.haveModel('user', 'User')
  const Email = await I.haveModel('email', 'Email')

  await User.create({ id: user, roles: [] })
  await Email.create({ id: email, email, user })
  I.amOnPage('/')
  const session = await I.executeScript(() => api.client.value.session)

  I.amOnPage('/reset-password')
  I.fillField('input#email', email)

  I.click('button[type=submit]')

  I.seeInCurrentUrl('/sent')
  let url = await I.grabCurrentUrl()
  const authentication = url.split('/').pop()

  const authenticationData = await I.grabObject('messageAuthentication', 'Authentication', authentication)
  console.log("AUTHENTICATION DATA", authenticationData)
  I.assert(!!authenticationData, true, 'authentication created')
  I.assert(authenticationData?.messageData?.user, user, 'authentication message data contains user')
  I.assert(authenticationData?.actionProperties?.user, user, 'authentication action properties contains user')

  await I.useSecretCode(authentication, happyPath)

  I.seeInCurrentUrl('/set-new-password/')
  url = await I.grabCurrentUrl()
  const resetPasswordAuthentication = url.split('/').pop()
  await I.wait(0.1)
  const ResetPasswordAuthentication = await I.haveModel('passwordAuthentication', 'ResetPasswordAuthentication')
  const resetPasswordAuthenticationData =
      await ResetPasswordAuthentication.indexObjectGet('byKey', resetPasswordAuthentication)
  I.assert(!!resetPasswordAuthenticationData, true, 'reset password authentication created')

  I.see('Reset password')

  const password = passwordGenerator.generate({
    length: 10,
    numbers: true
  })+(Math.random()*10).toFixed()
  I.fillField('input#newPassword', password)
  I.fillField('input#reenterPassword', password)

  I.click('button[type=submit]')
  I.seeInCurrentUrl('/reset-password-finished')

})
