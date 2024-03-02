import definition from './definition.js'

import './model.js'
import './change.js'
import './signIn.js'
import './reset.js'

import passwordValidator from './passwordValidator.js'

definition.processor(function(service, app) {
  service.validators.password = passwordValidator
})

export default definition
