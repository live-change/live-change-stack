const app = require("@live-change/framework").app()

const definition = require('./definition.js')

definition.processor(function(service, app) {
  service.validators.phone = require('./phoneValidator.js')
})

require('./send.js')
require('./auth.js')

module.exports = definition


