import { prepareParameters, processReturn } from "./params.js"
import SplitEmitQueue from "../utils/SplitEmitQueue.js"
import SingleEmitQueue from "../utils/SingleEmitQueue.js"

import { context, propagation, trace } from '@opentelemetry/api'
import { SpanKind } from '@opentelemetry/api'
const tracer = trace.getTracer('live-change:triggerHandler')

import { expandObjectAttributes } from '../utils.js'

async function spanAttributes(trig, service) {
  return {
    ...expandObjectAttributes(trig, 'trigger'),
    service: service.name
  }
}

import { loggingHelpers } from '../utils.js'

class TriggerHandler {

  constructor(definition, service) {
    this.definition = definition
    this.service = service

    if(definition.queuedBy) {
      const queuedBy = definition.queuedBy
      this.queueKeyFunction = typeof queuedBy == 'function' ? queuedBy : (
        Array.isArray(queuedBy) ? (c) => JSON.stringify(queuedBy.map(k=>c[k])) :
          (c) => JSON.stringify(c[queuedBy]) )
    }

    this.loggingHelpers = loggingHelpers(service.name, service.app.config.clientConfig.version, {
      triggerType: definition.name,
    })
  }

  async doExecute(trig, emit) {
    //console.log("PARAMETERS", JSON.stringify(parameters), "DEFN", this.definition.properties)
    const parameters = trig.data
    const preparedParams = await prepareParameters(parameters, this.definition.properties, this.service)
    //console.log("PREP PARAMS", preparedParams)

    let resultPromise = Promise.resolve(this.definition.execute({
      ...preparedParams
    }, {
      ...trig,
      action: this,
      service: this.service,
      client: trig.client,
      reaction: trig,
      // TODO: add trigger information to the context, it can be renamed to "reaction"
      trigger: (trigger, data) => this.service.trigger({
        causeType: 'trigger',
        cause: trig.id,
        client: trig.client,
        ...trigger
      }, data),
      triggerService: (trigger, data, returnArray = false) => this.service.triggerService({
        causeType: 'trigger',
        cause: trig.id,
        client: trig.client,
        ...trigger
      }, data, returnArray),
      ...this.loggingHelpers
    }, emit))
    //console.log("RESULT PROMISE", resultPromise, resultPromise.then)
    resultPromise = resultPromise.then(async result => {
      const processedResult = await processReturn(result, this.definition.returns, this.service)
      return processedResult
    })
    resultPromise.catch(error => {
      this.loggingHelpers.error(`Trigger ${this.definition.name} error `, error)
    })
    return resultPromise
  }

  async execute(trig, service) {
    //console.log("EXECUTE", trig, this.queueKeyFunction)
    const profileOp = await service.profileLog.begin({
      operation: 'queueTrigger', triggerType: this.definition.name,
      triggerId: trig.id, by: trig.by
    })
    if(this.queueKeyFunction) {
      //console.log("QUEUED TRIGGER STARTED", trig)
      return tracer.startActiveSpan('queueTrigger:'+service.name+'.'+this.definition.name, { 
        kind: SpanKind.INTERNAL, 
        attributes: spanAttributes(trig, service) 
      }, async (queueSpan) => {      
        const queueContext = context.active()

        const routine = () => service.profileLog.profile({
          operation: 'runTrigger', triggerType: this.definition.name,
          commandId: trig.id, by: trig.by
        }, async () => {
          return tracer.startActiveSpan('handleTrigger:'+service.name+'.'+this.definition.name, { 
            kind: SpanKind.INTERNAL, 
            attributes: spanAttributes(trig, service) 
          }, queueContext, async (handleSpan) => {        
            let result
            const reportFinished = this.definition.waitForEvents ? 'trigger_' + trig.id : undefined
            const _trace = {}
            propagation.inject(context.active(), _trace)
            const flags = {triggerId: trig.id, reportFinished, _trace }
            const emit = service.app.splitEvents
              ? new SplitEmitQueue(service, flags)
              : new SingleEmitQueue(service, flags)

            await tracer.startActiveSpan('runTrigger', { 
              kind: SpanKind.SERVER, 
              attributes: spanAttributes(trig, service) 
            }, queueContext, async (runSpan) => {              
              try {
                //console.log("TRIGGER RUNNING!", trig)         

                result = await service.app.assertTime('trigger ' + this.definition.name,
                  this.definition.timeout || 10000,
                  () => this.doExecute(trig, (...args) => emit.emit(...args)))          
              } catch (e) {
                this.loggingHelpers.error(`Trigger ${this.definition.name} error `, e.stack)
                runSpan.end()
                handleSpan.end()
                queueSpan.end()
                throw e
              }
              runSpan.end()
              return result
            })                    
            return await tracer.startActiveSpan('emitEvents', {
              kind: SpanKind.INTERNAL, 
              attributes: spanAttributes(trig, service) 
            }, queueContext, async (emitEventsSpan) => {              
              const events = await emit.commit()
              if (this.definition.waitForEvents)
                await service.app.waitForEvents(reportFinished, events, this.definition.waitForEvents)
              emitEventsSpan.end()
              handleSpan.end()
              queueSpan.end()
              return result
            })
          })
        })
        try {
          routine.key = this.queueKeyFunction(trig)
        } catch (e) {
          this.loggingHelpers.error("Queue key function error ", e)
        }
        this.loggingHelpers.log("Trigger queue key", routine.key)
        const promise = service.keyBasedExecutionQueues.queue(routine)
        await service.profileLog.endPromise(profileOp, promise)
        return promise
      })
    } else {
      return tracer.startActiveSpan('handleTrigger:'+service.name+'.'+this.definition.name, { 
        kind: SpanKind.INTERNAL, 
        attributes: spanAttributes(trig, service) 
      }, async (handleSpan) => {      
        this.loggingHelpers.log("Not queued trigger started", trig)
        const reportFinished = this.definition.waitForEvents ? 'trigger_'+trig.id : undefined      
        const _trace = {}
        propagation.inject(context.active(), _trace)
        const flags = { triggerId: trig.id, reportFinished, _trace }
        const emit = service.app.splitEvents
          ? new SplitEmitQueue(service, flags)
          : new SingleEmitQueue(service, flags)
        let result        
        await tracer.startActiveSpan('runTrigger:'+service.name+'.'+this.definition.name, { 
          kind: SpanKind.SERVER, 
          attributes: spanAttributes(trig, service) 
        }, async (runSpan) => {
          try {          
            result = await service.app.assertTime('trigger '+this.definition.name,
              this.definition.timeout || 10000,
              () => this.doExecute(trig, (...args) => emit.emit(...args)))
            runSpan.end()
            this.loggingHelpers.log("Trigger done", trig)
          } catch (e) {
            this.loggingHelpers.error(`Trigger ${this.definition.name} error `, e.stack)
            runSpan.end()
            handleSpan.end()
            throw e
          }
        })
        return tracer.startActiveSpan('emitEvents', { 
          kind: SpanKind.INTERNAL, 
          attributes: spanAttributes(trig, service) 
        }, async (emitEventsSpan) => {          
          const events = await emit.commit()      
          if(this.definition.waitForEvents)
            await service.app.waitForEvents(reportFinished, events, this.definition.waitForEvents)
          emitEventsSpan.end()
          handleSpan.end()
          await service.profileLog.end(profileOp)
          return result
        })
      })
    }
  }

}

export default TriggerHandler
