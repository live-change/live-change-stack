const app = require("@live-change/framework").app()

const definition = require('./definition.js')

require('./ban.js')
require('./event.js')
require('./secured.js')

module.exports = definition
