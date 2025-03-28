import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

const { 
  queueDuration = 1 * 60 * 1000,
} = definition.config

const loadMoreAfter = Math.floor(queueDuration / 2)

export { queueDuration, loadMoreAfter }
