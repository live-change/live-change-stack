const App = require('@live-change/framework')
const app = App.app()

module.exports = async function(services) {

  const { PasswordAuthentication } = services.passwordAuthentication.models
  const { PublicAccess, Access, AccessRequest, AccessInvitation } = services.accessControl.models

  async function createUser(name, email, password) {
    const user = app.generateUid()
    const passwordHash = PasswordAuthentication.definition.properties.passwordHash.preFilter(password)
    await services.user.models.User.create({ id: user, roles: [] })
    await PasswordAuthentication.create({ id: user, user, passwordHash })
    await services.email.models.Email.create({ id: email, email, user })
    await services.userIdentification.models.Identification.create({
      id: App.encodeIdentifier(['user_User', user]), sessionOrUserType: 'user_User', sessionOrUser: user,
      name
    })
    return {
      id: user,
      name,
      email,
      password
    }
  }

  const session = 'xyLRAj38fIMjTImlkgzvkdVefXTZk/1j'

  //console.log("MDL", services.passwordAuthentication.models.PasswordAuthentication)
  //await services.user.models.AuthenticatedUser.create({ id: session, session, user })

  const user1 = await createUser('Test User 1', 'test1@test.com', 'Testy123')
  const user2 = await createUser('Test User 2 with very long name!', 'test2@test.com', 'Testy123')
  const user3 = await createUser('Test User 3', 'test3@test.com', 'Testy123')


/*  await PublicAccess.create({
    id: App.encodeIdentifier(['example_Example', 'one']),
    objectType: 'example_Example', object: 'one',
    userRoles: ['reader'],
    sessionRoles: []
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
