const app = require("@live-change/framework").app()

const relationsPlugin = require('@live-change/relations-plugin')
const accessControlService = require('@live-change/access-control-service')

const definition = app.createServiceDefinition({
  name: "blog",
  use: [ relationsPlugin, accessControlService ]
})

module.exports = definition
