const app = require("@live-change/framework").app()

const relationsPlugin = require('@live-change/relations-plugin')
const accessControlService = require('@live-change/user-service')

const definition = app.createServiceDefinition({
  name: "pages",
  use: [ relationsPlugin, accessControlService ]
})

module.exports = definition
