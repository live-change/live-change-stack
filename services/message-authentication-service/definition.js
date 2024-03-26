import App from '@live-change/framework'
const app = App.app()

import security from '@live-change/security-service'

const definition = app.createServiceDefinition({
  name: "messageAuthentication",
  use: [ security ]
})

export default definition
