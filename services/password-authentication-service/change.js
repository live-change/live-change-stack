import definition from './definition.js'
import { PasswordAuthentication, secretProperties } from './model.js'

definition.action({
  name: 'setPassword',
  waitForEvents: true,
  properties: {
    ...secretProperties
  },
  access: (params, { client }) => {
    return !!client.user
  },
  async execute({ passwordHash }, { client, service }, emit) {
    const user = client.user
    const passwordAuthenticationData = await PasswordAuthentication.get(user)
    if(passwordAuthenticationData) throw 'exists'
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
    currentPasswordHash: secretProperties.passwordHash,
    ...secretProperties
  },
  access: (params, { client }) => {
    return !!client.user
  },
  async execute({ currentPasswordHash, passwordHash }, { client, service }, emit) {
    const user = client.user
    const passwordAuthenticationData = await PasswordAuthentication.get(user)
    if(!passwordAuthenticationData) throw 'notFound'
    if(currentPasswordHash != passwordAuthenticationData.passwordHash) throw { properties: {
      currentPasswordHash: 'wrongPassword'
    } }
    emit({
      type: 'passwordAuthenticationSet',
      user, passwordHash
    })
  }
})
