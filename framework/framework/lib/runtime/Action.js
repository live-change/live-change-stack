import { prepareParameters, processReturn, preFilterParameters } from "./params.js"

import { context, propagation, trace } from '@opentelemetry/api'
import { loggingHelpers } from '../utils.js'
import { SpanKind } from '@opentelemetry/api'
const tracer = trace.getTracer('live-change:action')

import { expandObjectAttributes } from '../utils.js'

class Action {

  constructor(definition, service) {
    this.definition = definition
    this.service = service
    this.loggingHelpers = loggingHelpers(this.service.name, this.service.app.config.clientConfig.version, {
      action: this.definition.name,
    })
  }

  async runCommand(command, emit, traceContext) {
    return tracer.startActiveSpan('runCommand:'+this.service.name+'.'+this.definition.name, { 
      kind: SpanKind.SERVER, 
      attributes: {
        ...expandObjectAttributes(command, 'command'),
        service: this.service.name,
        action_name: this.definition.name,
        action_waitForEvents: this.definition.waitForEvents,
        action_timeout: this.definition.timeout,
        action_requestTimeout: this.definition.requestTimeout,
      }
    }, traceContext, async (runSpan) => {                

      let parameters = command.parameters
      //console.log("PARAMETERS", JSON.stringify(parameters), "DEFN", this.definition.properties)
      let preparedParams = await prepareParameters(parameters, this.definition.properties, this.service)
      //console.log("PREP PARAMS", preparedParams)

      let resultPromise = (async () => this.definition.execute({
        ...parameters,
        ...preparedParams
      }, {
        action: this,
        service: this.service,
        client: command.client,
        command,
        trigger: (trigger, data) => this.service.trigger({
          causeType: 'action',
          cause: command.id,
          client: command.client,
          ...trigger
        }, data),
        triggerService: (trigger, data, returnArray = false) => this.service.triggerService({
          causeType: 'action',
          cause: command.id,
          client: command.client,
          ...trigger
        }, data, returnArray),
        ...this.loggingHelpers
      }, emit))()

      resultPromise = resultPromise.then(async result => {
        let processedResult = await processReturn(result, this.definition.returns, this.service)
        runSpan.end()
        return processedResult
      })
      resultPromise.catch(error => {
        this.loggingHelpers.error(`Action ${this.definition.name} error `, error.stack || error)
        runSpan.end()
      })    
      return resultPromise
    })
  }

  async callCommand(parameters, clientData) {
    // if(!clientData.roles) throw new Error("no roles") - roles are not required in frontend
    const _trace = {}
    propagation.inject(context.active(), _trace)
    const command = {
      type: this.definition.name,
      service: this.service.name,
      client: clientData,
      parameters: await preFilterParameters(parameters, this.definition.properties),
      _trace
    }
    if(parameters._commandId) command.id = parameters._commandId
    //console.log("CALL COMMAND", JSON.stringify(command, null, "  "))
    return this.service.app.command(command, this.definition.requestTimeout || this.definition.timeout)
  }
}

export default Action
