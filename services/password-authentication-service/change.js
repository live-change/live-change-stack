import definition from './definition.js'
import { PasswordAuthentication, secretProperties } from './model.js'

definition.action({
  name: 'setPassword',
  waitForEvents: true,
  properties: {
    ...secretProperties(true)
  },
  access: (params, { client }) => {
    return !!client.user
  },
  async execute({ passwordHash }, { client, service }, emit) {
    const user = client.user
    const passwordAuthenticationData = await PasswordAuthentication.get(user)
    if(passwordAuthenticationData) throw app.logicError("exists")
    emit({
      type: 'passwordAuthenticationSet',
      user, passwordHash
    })
  }
})

definition.action({
  name: 'changePassword',
  waitForEvents: true,
  properties: {
    currentPasswordHash: secretProperties(true).passwordHash,
    ...secretProperties(true)
  },
  access: (params, { client }) => {
    return !!client.user
  },
  async execute({ currentPasswordHash, passwordHash }, { client, service }, emit) {
    const user = client.user
    const passwordAuthenticationData = await PasswordAuthentication.get(user)
    if(!passwordAuthenticationData) throw app.logicError("notFound")
    if(currentPasswordHash !== passwordAuthenticationData.passwordHash) throw { properties: {
      currentPasswordHash: 'wrongPassword'
    } }
    emit({
      type: 'passwordAuthenticationSet',
      user, passwordHash
    })
  }
})
