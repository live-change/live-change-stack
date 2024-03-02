const {createUser} = require("@live-change/user-frontend/server/init-functions.js");
const App = require('@live-change/framework')
const app = App.app()

module.exports = async function(services) {
  const user1 = await createUser(services,
    'Test User 1', 'test1@test.com', 'Testy123', 'u1', ['writer'])

  await services.url.models.Canonical.create({
    id: App.encodeIdentifier(['example_Example', 'one']),
    domain: '',
    path: 'test2',
    targetType: 'example_Example',
    target: 'one'
  })
  await services.url.models.Redirect.create({
    id: app.generateUid(),
    domain: 'localhost',
    path: 'test3',
    targetType: 'example_Example',
    target: 'one'
  })

  await services.accessControl.models.PublicAccess.create({
    id: App.encodeIdentifier(['example_Example', 'one']),
    objectType: 'example_Example',
    object: 'one',
    sessionRoles: ['writer']
  })
}
