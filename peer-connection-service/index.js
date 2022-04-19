const App = require("@live-change/framework")
const app = App.app()

const definition = require('./definition.js')

require('./turn.js')
require('./peer.js')

module.exports = definition
