const app = require("@live-change/framework").app()

const definition = app.createServiceDefinition({
  name: "accessControl"
})

module.exports = definition
