import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

const {
  contactTypes = []
} = definition.config

const config = {
  ...definition.config,
  contactTypes
}

export default config