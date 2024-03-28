import App from '@live-change/framework'
const app = App.app()
import user from '@live-change/user-service'

const definition = app.createServiceDefinition({
  name: "phone",
  use: [ user ]
})

export default definition
