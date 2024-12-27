import App from '@live-change/framework'
const app = App.app()

const definition = app.createServiceDefinition({
  name: "analytics"
})
const config = definition.config

const queueConcurrency = config.queueConcurrency || 10

const Event = definition.model({
  name: "Event",
  properties: {
    type: {
      type: String
    },
    timestamp: {
      type: Number
    },
    client: {
      type: Object
    },
    data: {
      type: Object
    }
  },
  indexes: {
    timestamp: {
      property: 'timestamp',
      function: async function(input, output) {
        const mapper = (obj) => ({ id: (''+obj.timestamp).padStart(16, '0') + '_' + obj.id, to: obj.id })
        await input.table('analytics_Event').onChange(
            (obj, oldObj) => output.change(obj && mapper(obj), oldObj && mapper(oldObj))
        )
      }
    }
  }
})

export default definition
