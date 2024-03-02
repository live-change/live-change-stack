import App from '@live-change/framework'
const app = App.app()

export default async function(services) {

  const user = '[testUser]'
  const email = 'tester@test.com'
  const email2 = 'tester2@test.com'
  const password = 'Testy123'
  const session = 'GOzz0WylRDklhLCSppS6bwRYUeIQJqzt'
  //console.log("MDL", services.passwordAuthentication.models.PasswordAuthentication)
  const passwordHash = services.passwordAuthentication.models.PasswordAuthentication
      .definition.properties.passwordHash.preFilter(password)
  await services.user.models.User.create({ id: user, roles: [] })
  await services.passwordAuthentication.models.PasswordAuthentication.create({ id: user, user, passwordHash })
  await services.email.models.Email.create({ id: email, email, user })
  await services.email.models.Email.create({ id: email2, email: email2, user })

  await services.user.models.AuthenticatedUser.create({ id: session, session, user })

  await services.notification.models.NotificationSetting.create({
    id: App.encodeIdentifier([ 'email_Email', email, 'example_TestNotification', 'example_TestNotification' ]),
    contactType: 'email_Email',
    contact: email,
    notificationType: 'example_TestNotification',
    notification: 'example_TestNotification',
    active: true,
    lastChanged: new Date()
  })

  await services.notification.models.Notification.create({
    id: app.generateUid(),
    sessionOrUserType: 'user_User',
    sessionOrUser: user,
    time: new Date(),
    state: 'new',
    readState: 'new',
    notificationType: 'example_TestNotification'
  })

  for(let i = 1; i <= 12; i++) {
    await services.notification.models.Notification.create({
      id: app.generateUid(),
      sessionOrUserType: 'user_User',
      sessionOrUser: user,
      time: new Date(Date.now() - i * 60 * 1000),
      state: 'new',
      readState: 'new',
      notificationType: 'example_RandomNotification'
    })
  } //*/

}
