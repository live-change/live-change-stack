import App from '@live-change/framework'
const app = App.app()

const definition = app.createServiceDefinition({
  name: "cron"
})

export default definition