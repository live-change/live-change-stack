import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'
import accessControlService from '@live-change/access-control-service'

const definition = app.createServiceDefinition({
  name: "balance",
  use: [ relationsPlugin, accessControlService ]
})

export default definition
