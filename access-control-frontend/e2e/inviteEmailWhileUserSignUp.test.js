const happyPath = false

const randomProfile = require('random-profile-generator')

Feature('access control invite')

Scenario('invite user that will register itself at the same time - path 3', async ({ I }) => {

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

  session('Invited', async () => {
    I.amOnPage('/user/sign-up')

    I.fillField('input[id="email"]', invitedEmail)
    I.click('button[type="submit"]')

    I.seeInCurrentUrl('/sent/')
    const url = await I.grabCurrentUrl()
    const authentication = url.split('/').pop()

    const authenticationData = await I.grabObject('messageAuthentication', 'Authentication', authentication)
    console.log("AUTHENTICATION DATA", authenticationData)
    I.assert(!!authenticationData, true, 'authentication created')

    const linkData = await I.useSecretLink(authentication, true, '/user')

    I.seeInCurrentUrl('/user/sign-up-finished')
    const clientSession = await I.executeScript(() => api.client.value.session)
    const AuthenticatedUser = await I.haveModel('user', 'AuthenticatedUser')
    const authenticatedUserData = await AuthenticatedUser.get(clientSession)
    I.assert(!!authenticatedUserData, true, 'user authenticated server-side')
    const clientUser = await I.executeScript(() => api.client.value.user)
    console.log("CLIENT USER", clientUser)
    console.log("SERVER AUTHENTICATION", authenticatedUserData)
    I.assert(clientUser, authenticatedUserData.user, 'user authenticated')


  })

  session('Inviting', () => {
    I.see('Access Invitations')
    I.see(invitedName)
    I.wait(23)
  })
})
