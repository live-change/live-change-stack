import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'
import accessControlService from '@live-change/access-control-service'
import taskService from '@live-change/task-service'

const definition = app.createServiceDefinition({
  name: "cron", 
  use: [ relationsPlugin, accessControlService, taskService ]
})

export default definition