import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import './model.js'
import task from './task.js'

export { task }

definition.beforeStart(() => {
  /// TODO: restart stopped tasks
})

export default definition
