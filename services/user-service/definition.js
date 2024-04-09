import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'

const definition = app.createServiceDefinition({
  name: "user",
  use: [ relationsPlugin ]
})

const config = definition.config

definition.clientConfig = {
  remoteAccountTypes: config.remoteAccountTypes
}

export default definition
