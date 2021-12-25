const app = require("@live-change/framework").app()

const definition = require('./definition.js')
const config = definition.config

require('./authentication.js')
require('./sign.js')

module.exports = definition
