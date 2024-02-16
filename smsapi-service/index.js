import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

definition.processor(function(service, app) {
  service.validators.phone = require('./phoneValidator.js')
})

require('./send.js')
require('./auth.js')

export default definition


