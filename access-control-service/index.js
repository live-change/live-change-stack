const app = require("@live-change/framework").app()

const definition = require('./definition.js')

require('./model.js')
require('./invite.js')
require('./request.js')

module.exports = definition
