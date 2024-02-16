import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'
const accessControlService = require('@live-change/access-control-service')

const definition = app.createServiceDefinition({
  name: "slug",
  use: [ relationsPlugin, accessControlService ]
})

export default definition
