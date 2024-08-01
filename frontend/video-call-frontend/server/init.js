import App from '@live-change/framework'
const app = App.app()

export default async function(services) {

  const { Room } = services.videoCall.models

  await Room.create({
    id: '[test-room]',
    name: 'Test Room',
    description: 'This is a test room',
  })

  const { PublicAccess, Access, AccessRequest, AccessInvitation } = services.accessControl.models

  await PublicAccess.create({
    id: App.encodeIdentifier(['videoCall_Room', '[test-room]']),
    objectType: 'Room', object: '[test-room]',
    userRoles: ['speaker'],
    sessionRoles: ['speaker']
  })


  const user = '[testUser]'
  const email = 'tester@test.com'
  const email2 = 'tester2@test.com'
  const password = 'Testy123'
  const passwordHash = services.passwordAuthentication.models.PasswordAuthentication
    .definition.properties.passwordHash.preFilter(password)
  await services.user.models.User.create({ id: user, roles: [] })
  await services.passwordAuthentication.models.PasswordAuthentication.create({ id: user, user, passwordHash })
  await services.email.models.Email.create({ id: email, email, user })
  await services.email.models.Email.create({ id: email2, email: email2, user })

}
