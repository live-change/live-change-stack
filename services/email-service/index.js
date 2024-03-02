import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import './send.js'
import './auth.js'

import validator from './emailValidator.js'

definition.processor(function(service, app) {
  service.validators.email = validator
})

export default definition
