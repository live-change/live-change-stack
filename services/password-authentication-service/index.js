import definition from './definition.js'

import './model.js'
import './change.js'
import './signIn.js'
import './reset.js'

import passwordValidator from './passwordValidator.js'

definition.validator('password', passwordValidator)

export default definition
