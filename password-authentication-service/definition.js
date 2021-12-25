const app = require("@live-change/framework").app()
const user = require('@live-change/user-service')

const definition = app.createServiceDefinition({
  name: "passwordAuthentication",
  use: [ user ]
})

module.exports = definition
