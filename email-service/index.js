const app = require("@live-change/framework").app()

const definition = require('./definition.js')

require('./send.js')
require('./auth.js')

definition.processor(function(service, app) {
  service.validators.email = require('./emailValidator.js')
})

module.exports = definition
