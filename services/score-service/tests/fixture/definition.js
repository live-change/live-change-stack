import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'

const definition = app.createServiceDefinition({
  name: 'scoreTest',
  use: [relationsPlugin]
})

export default definition
