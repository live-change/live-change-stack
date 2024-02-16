import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'
import userService from '@live-change/user-service'
import accessControlService from '@live-change/access-control-service'

const definition = app.createServiceDefinition({
  name: "url",
  use: [ relationsPlugin, userService, accessControlService ]
})

export default definition
