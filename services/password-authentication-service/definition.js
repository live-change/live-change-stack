import App from '@live-change/framework'
const app = App.app()
import user from '@live-change/user-service'
import email from '@live-change/email-service'

const definition = app.createServiceDefinition({
  name: "passwordAuthentication",
  use: [ user, email ]
})

export default definition
