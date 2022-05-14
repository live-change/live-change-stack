const app = require("@live-change/framework").app()

const userService = require("@live-change/user-service")
const relationsPlugin = require('@live-change/relations-plugin')

const definition = app.createServiceDefinition({
  name: "notification",
  use: [ relationsPlugin, userService ]
})

const config = definition.config

definition.clientConfig = {
  contactTypes: config.contactTypes,
  notificationTypes: config.notificationTypes
}

module.exports = definition
