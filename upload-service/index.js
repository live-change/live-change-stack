const app = require("@live-change/framework").app()

const definition = require('./definition.js')

require('./endpoint.js')
require('./model.js')

module.exports = definition
