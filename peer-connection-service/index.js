import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

require('./turn.js')
require('./peer.js')

export default definition
