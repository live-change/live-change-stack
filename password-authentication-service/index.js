const definition = require('./definition.js')

require('./model.js')
require('./change.js')
require('./signIn.js')
require('./reset.js')

definition.processor(function(service, app) {
  service.validators.password = require('./passwordValidator.js')
})


module.exports = definition
