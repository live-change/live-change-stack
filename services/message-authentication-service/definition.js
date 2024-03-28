import App from '@live-change/framework'
const app = App.app()

import security from '@live-change/security-service'

const definition = app.createServiceDefinition({
  name: "messageAuthentication",
  use: [ security ]
})

const config = definition.config

definition.clientConfig = {
  contactTypes: config.contactTypes
}

export default definition
