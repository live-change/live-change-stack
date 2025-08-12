import crypto from 'crypto'
import definition from './definition.js'
const config = definition.config

const secretProperties = (required = true) => ({
  passwordHash: {
    type: String,
    secret: true,
    preFilter: config.passwordHash ||
      (password => password && crypto.createHash('sha256').update(password).digest('hex')),
    validation: [
      ...(required ? ['nonEmpty'] : []),
      ...(config.passwordValidation || ['password']),      
    ]
  },
})

const PasswordAuthentication = definition.model({
  name: 'PasswordAuthentication',
  userProperty: {
    userViews: [
      { suffix: 'Exists', fields: ['user'] }
    ]
  },
  properties: {
    ...secretProperties(true),
  }
})

definition.event({
  name: 'passwordAuthenticationSet',
  async execute({ user, passwordHash }) {
    await PasswordAuthentication.create({ id: user, user, passwordHash })
  }
})

export { PasswordAuthentication, secretProperties }
