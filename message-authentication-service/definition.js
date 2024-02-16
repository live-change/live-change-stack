import App from '@live-change/framework'
const app = App.app()

import security from '@live-change/security-service'
import email from '@live-change/email-service'

const definition = app.createServiceDefinition({
  name: "messageAuthentication",
  use: [ security, email ]
})

export default definition
