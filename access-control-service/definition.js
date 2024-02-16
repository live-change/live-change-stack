import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'
import userService from '@live-change/user-service'
import emailService from '@live-change/email-service'

const definition = app.createServiceDefinition({
  name: "accessControl",
  use: [ relationsPlugin, userService, emailService ]
})

export default definition
