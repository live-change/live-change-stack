import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import './send.js'
import './auth.js'
import './notiifcations.js'

import validator from './emailValidator.js'
definition.validator('email', validator)

export default definition
