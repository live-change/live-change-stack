const app = require("@live-change/framework").app()

const relationsPlugin = require('@live-change/relations-plugin')
const userService = require('@live-change/user-service')

const definition = app.createServiceDefinition({
  name: "userIdentification",
  use: [ relationsPlugin, userService ]
})

module.exports = definition
