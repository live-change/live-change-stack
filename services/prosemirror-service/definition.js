import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'
import userService from '@live-change/user-service'

const definition = app.createServiceDefinition({
  name: "prosemirror",
  use: [ userService, relationsPlugin ]
})

export default definition
