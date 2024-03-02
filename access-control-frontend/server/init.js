const App = require('@live-change/framework')
const app = App.app()

const { createUser } = require('@live-change/user-frontend/server/init-functions.js')

module.exports = async function(services) {

  const { PasswordAuthentication } = services.passwordAuthentication.models
  const { PublicAccess, Access, AccessRequest, AccessInvitation } = services.accessControl.models

  const session = 'l5W5GIeTfffiFpfUTkvpjNjrVR6buWDX'

  //console.log("MDL", services.passwordAuthentication.models.PasswordAuthentication)

  const user1 = await createUser(services,
    'Test User 1', 'test1@test.com', 'Testy123', 'u1')
  const user2 = await createUser(services,
    'Test User 2 with very long name!', 'test2@test.com', 'Testy123')
  const user3 = await createUser(services,
    'Test User 3', 'test3@test.com', 'Testy123')

  await services.user.models.AuthenticatedUser.create({ id: session, session, user: user1.id })

  await services.notification.models.Notification.create({
    "id": app.generateUid(),
    "notificationType": "accessControl_Invitation",
    "objectType": "example_Example",
    "object": "one",
    "fromType": "user_User",
    "from": user1.id,
    "sessionOrUserType": "user_User",
    "sessionOrUser": user2.id,
    "time": "2022-05-23T13:13:25.501Z",
    "readState": "new"
  })

 /* await PublicAccess.create({
    id: App.encodeIdentifier(['example_Example', 'one']),
    objectType: 'example_Example', object: 'one',
    userRoles: ['reader'],
    sessionRoles: ['reader']
  })*/

  await Access.create({
    id: App.encodeIdentifier(['user_User', user1.id, 'example_Example', 'one']),
    sessionOrUserType: 'user_User', sessionOrUser: user1.id,
    objectType: 'example_Example', object: 'one',
    roles: ['administrator']
  })

  await AccessRequest.create({
    id: App.encodeIdentifier(['user_User', user2.id, 'example_Example', 'one']),
    sessionOrUserType: 'user_User', sessionOrUser: user2.id,
    objectType: 'example_Example', object: 'one',
    roles: ['writer']
  })

  await AccessInvitation.create({
    id: App.encodeIdentifier(['user_User', user3.id, 'example_Example', 'one']),
    contactOrUserType: 'user_User', contactOrUser: user3.id,
    objectType: 'example_Example', object: 'one',
    roles: ['moderator']
  })

  await AccessInvitation.create({
    id: App.encodeIdentifier(['email_Email', 'tester@test.com', 'example_Example', 'one']),
    contactOrUserType: 'email_Email', contactOrUser: 'tester@test.com',
    objectType: 'example_Example', object: 'one',
    roles: ['moderator']
  })

}
