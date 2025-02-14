import App from '@live-change/framework'
const app = App.app()

import userService from '@live-change/user-service'
import relationsPlugin from '@live-change/relations-plugin'

const definition = app.createServiceDefinition({
  name: "notification",
  use: [ userService, relationsPlugin ]
})

export default definition
