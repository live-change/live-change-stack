const happyPath = true

Feature('access control invite')

Scenario('invite user that already exists - path 1', async ({ I }) => {

  const adminUser = await I.haveUser()
  const anotherUser = await I.haveUser()
  await I.haveUserWithAccess(adminUser, 'example_Example', 'one', ['administrator'])

  console.log('ADMIN', adminUser)
  console.log("ANOTHER USER", anotherUser)

  session('X')
  session('Y')
  I.amOnPage('/')

  session('X', async () => {
    await I.amOnPage('/')
    await I.amLoggedIn(adminUser)
    I.see('Access Granted!')
    I.click('Share')
    I.see('Access Control')
    I.click('Invite with email')
    I.see('Invite user with email')
    I.see('Email address')
    I.fillField('input[id="email"]', anotherUser.email)
    I.click('Invite')
    I.wait(5)
    I.see('Access Invitations')
    //I.see(anotherUser.name)
  })
  session('Y', async () => {
    I.amOnPage('/')
    await I.amLoggedIn(anotherUser)
    I.click('i.pi.pi-bell')
    I.click('Accept')
  })
  session('X', () =>{
  I.see('Authorized')
  I.see(anotherUser.name)
  I.wait(23)
  })
})
