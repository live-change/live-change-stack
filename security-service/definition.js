const app = require("@live-change/framework").app()

const definition = app.createServiceDefinition({
  name: "securityService"
})
const config = definition.config

module.exports = definition
