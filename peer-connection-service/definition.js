const App = require("@live-change/framework")
const app = App.app()

const relationsPlugin = require('@live-change/relations-plugin')

const definition = app.createServiceDefinition({
  name: "peerConnection",
  use: [ relationsPlugin ]
})

module.exports = definition