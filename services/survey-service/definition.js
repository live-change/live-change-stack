import App from '@live-change/framework'
const app = App.app()

import userService from '@live-change/user-service'
import relationsPlugin from '@live-change/relations-plugin'
import accessControlService from '@live-change/access-control-service'

const definition = app.createServiceDefinition({
  name: "survey",
  use: [ userService, relationsPlugin, accessControlService ]
})

export default definition
