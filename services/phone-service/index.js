import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import phoneValidator from './phoneValidator.js'
definition.validator('phone', phoneValidator)

import './send.js'
import './auth.js'
export default definition


