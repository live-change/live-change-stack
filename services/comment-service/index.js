import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import './comment.js'

definition.beforeStart(() => {
  /// TODO: restart stopped tasks
})

export default definition
