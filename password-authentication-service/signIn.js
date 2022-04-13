const definition = require('./definition.js')
const config = definition.config

const { PasswordAuthentication, secretProperties } = require('./model.js')

for(const contactType of config.contactTypes) {

  const contactTypeUpperCaseName = contactType[0].toUpperCase() + contactType.slice(1)

  const contactConfig = (typeof contactType == "string") ? { name: contactType } : contactType

  const contactTypeName = contactConfig.name
  const contactTypeUName = contactTypeName[0].toUpperCase() + contactTypeName.slice(1)

  const contactTypeProperties = {
    [contactType]: {
      type: String,
      validation: ['nonEmpty', contactTypeName]
    }
  }

  definition.action({
    name: 'signIn' + contactTypeUpperCaseName,
    waitForEvents: true,
    properties: {
      ...contactTypeProperties,
      ...secretProperties
    },
    async execute({ [contactTypeName]: contact, passwordHash }, { client, service }, emit) {
      const contactData = (await service.trigger({
        type: 'get' + contactTypeUName,
        [contactType]: contact,
      }))[0]
      const { user } = contactData
      if(passwordHash) { // login with password
        console.log("USER!", user)
        const passwordAuthenticationData = await PasswordAuthentication.get(user)
        console.log("PASSWORD AUTH!", passwordAuthenticationData)
        if(!passwordAuthenticationData || passwordAuthenticationData.passwordHash != passwordHash)
          throw { properties: { passwordHash: 'wrongPassword' } }
        const { session } = client
        await service.trigger({
          type: 'signIn', user, session
        })
        return user
      } else { // login without password - with message
        if(!config.signInWithoutPassword) throw { properties: { passwordHash: 'empty' } }
        const messageData = {
          user
        }
        const results = await service.trigger({
          type: 'authenticateWithMessage',
          contactType,
          contact,
          messageData,
          action: 'signInWithMessage',
          targetPage: config.signInTargetPage || { name: 'user:signInFinished' }
        })
        return results[0]
      }
    }
  })

}
