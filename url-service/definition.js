const app = require("@live-change/framework").app()

const relationsPlugin = require('@live-change/relations-plugin')
const userService = require('@live-change/user-service')
const accessControlService = require('@live-change/access-control-service')

const definition = app.createServiceDefinition({
  name: "url",
  use: [ relationsPlugin, userService, accessControlService ]
})

module.exports = definition
