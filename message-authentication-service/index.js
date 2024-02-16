import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
const config = definition.config

import './authentication.js'
import './sign.js'

export default definition
