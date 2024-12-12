import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

const {
  clientId = process.env.LINKEDIN_CLIENT_ID,
  clientSecret = process.env.LINKEDIN_CLIENT_SECRET
} = definition.config

definition.clientConfig = {
  clientId
}

export default {
  clientId,
  clientSecret
}
