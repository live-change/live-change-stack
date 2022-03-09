const Helper = require('@codeceptjs/helper')
const wtf = require('wtfnode')
const { TestServer } = require('@live-change/server')

class LiveChangeHelper extends Helper {
  constructor(config) {
    super(config)
    this.config = config
  }

  async setup() {
    if(!this.setupPromise) this.setupPromise = (async () => {
      if(this.config.startServer) {
        this.testServer = new TestServer({
          dev: true,
          ...this.config,
          ssrRoot: this.config.ssrRoot || '../front',
          services: this.config.services || '../server/services.config.js'
        })
        console.log("starting test codecept server")
        try {
          await this.testServer.start()
        } catch(error) {
          console.error(error.stack)
          process.exit(1)
        }
        console.log("Test http server started on port", this.testServer.port)
        for(const key in this.helpers) {
          this.helpers[key].url = this.testServer.url
        }
      } else {
        /// TODO: get services and api access somehow...
      }
    })()
    return this.setupPromise
  }

  haveService(name) {
    const service = this.testServer.apiServer.services.services.find(service => service.name == name)
    if(!service) throw new Error('service '+name+' not found')
    return service
  }

  haveModel(serviceName, modelName) {
    const service = this.haveService(serviceName)
    const model = service.models[modelName]
    if(!model) throw new Error('model '+modelName+' not found')
    return model
  }

  haveView(serviceName, viewName) {
    const service = this.haveService(serviceName)
    const view = service.views[viewName]
    if(!view) throw new Error('view '+viewName+' not found')
    return view
  }

  haveAction(serviceName, actionName) {
    const service = this.haveService(serviceName)
    const action = service.actions[actionName]
    if(!action) throw new Error('action '+actionName+' not found')
    return action
  }

  haveTrigger(serviceName, triggerName) {
    const service = this.haveService(serviceName)
    const trigger = service.triggers[triggerName]
    if(!trigger) throw new Error('trigger '+triggerName+' not found')
    return trigger
  }

  async grabObject(serviceName, modelName, id) {
    const model = this.haveModel(serviceName, modelName)
    return await model.get(id)
  }

  _init() {

  }

  async _beforeSuite() {
    await this.setup()
  }

  async _finishTest() {
    if(this.testServer) {
      this.testServer.dispose()
      // setTimeout(() => {
      //   wtf.dump()
      // }, 1000)
    }
  }
}

module.exports = LiveChangeHelper