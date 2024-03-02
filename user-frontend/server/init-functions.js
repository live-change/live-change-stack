import App from '@live-change/framework'
const app = App.app()

async function createUser(services, name, email, password, user = app.generateUid(), roles = []) {
  const { PasswordAuthentication } = services.passwordAuthentication.models

  const passwordHash = PasswordAuthentication.definition.properties.passwordHash.preFilter(password)
  await services.user.models.User.create({ id: user, roles })
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

export { createUser }
