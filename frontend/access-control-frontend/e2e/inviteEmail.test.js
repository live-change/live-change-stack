const happyPath = false

const randomProfile = require('random-profile-generator')

Feature('access control invite')

Scenario('invite user that will register from invitation link - path 2', async ({ I }) => {

  const adminUser = await I.haveUser()
  await I.haveUserWithAccess(adminUser, 'example_Example', 'one', ['administrator'])

  const invitedName = randomProfile.profile().firstName
  const invitedEmail = invitedName.split(' ')[0].toLowerCase() + (Math.random()*100).toFixed() + '@test.com'

  console.log('ADMIN', adminUser)
  console.log("INVITED EMAIL", invitedEmail)

  session('Inviting', async () => {
    await I.amOnPage('/')
    await I.amLoggedIn(adminUser)
    I.see('Access Granted!')
    I.click('Share')
    I.see('Access Control')
    I.click('Invite with email')
    I.see('Invite user with email')
    I.see('Email address')
    I.fillField('input[id="email"]', invitedEmail)
    I.click('Invite')
  })

  session('Invited',
      async () => {
        await I.useEmailLink(invitedEmail, '/user/link/')
      })

  session('Inviting', () => {
    I.see('Access Invitations')
    I.see(invitedEmail)
    I.wait(23)
  })
})
