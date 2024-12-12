import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

const {
  clientId = process.env.GOOGLE_CLIENT_ID,
  clientSecret = process.env.GOOGLE_CLIENT_SECRET
} = definition.config

definition.clientConfig = {
  clientId
}

export default {
  clientId,
  clientSecret
}
