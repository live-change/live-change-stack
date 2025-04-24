import { prepareParameters, processReturn } from "./params.js"
import SplitEmitQueue from "../utils/SplitEmitQueue.js"
import SingleEmitQueue from "../utils/SingleEmitQueue.js"

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
      }, data, returnArray)
    }, emit))
    console.log("RESULT PROMISE", resultPromise, resultPromise.then)
    resultPromise = resultPromise.then(async result => {
      const processedResult = await processReturn(result, this.definition.returns, this.service)
      return processedResult
    })
    resultPromise.catch(error => {
      console.error(`Trigger ${this.definition.name} error `, error)
    })
    return resultPromise
  }

  async execute(trig, service) {
    console.log("EXECUTE", trig, this.queueKeyFunction)
    const profileOp = await service.profileLog.begin({
      operation: 'queueTrigger', triggerType: this.definition.name,
      triggerId: trig.id, by: trig.by
    })
    if(this.queueKeyFunction) {
      console.log("QUEUED TRIGGER STARTED", trig)
      const routine = () => service.profileLog.profile({
        operation: 'runTrigger', triggerType: this.definition.name,
        commandId: trig.id, by: trig.by
      }, async () => {
        let result
        const reportFinished = this.definition.waitForEvents ? 'trigger_' + trig.id : undefined
        const flags = {triggerId: trig.id, reportFinished}
        const emit = service.app.splitEvents
          ? new SplitEmitQueue(service, flags)
          : new SingleEmitQueue(service, flags)
        try {
          console.log("TRIGGER RUNNING!", trig)
          result = await service.app.assertTime('trigger ' + this.definition.name,
            this.definition.timeout || 10000,
            () => this.doExecute(trig, (...args) => emit.emit(...args)))
          console.log("TRIGGER DONE!", trig)
        } catch (e) {
          console.error(`TRIGGER ${this.definition.name} ERROR`, e.stack)
          throw e
        }
        const events = await emit.commit()
        if (this.definition.waitForEvents)
          await service.app.waitForEvents(reportFinished, events, this.definition.waitForEvents)
        return result
      })
      try {
        routine.key = this.queueKeyFunction(trig)
      } catch (e) {
        console.error("QUEUE KEY FUNCTION ERROR", e)
      }
      console.log("TRIGGER QUEUE KEY", routine.key)
      const promise = service.keyBasedExecutionQueues.queue(routine)
      await service.profileLog.endPromise(profileOp, promise)
      return promise
    } else {
      console.log("NOT QUEUED TRIGGER STARTED", trig)
      const reportFinished = this.definition.waitForEvents ? 'trigger_'+trig.id : undefined
      const flags = { triggerId: trig.id, reportFinished }
      const emit = service.app.splitEvents
        ? new SplitEmitQueue(service, flags)
        : new SingleEmitQueue(service, flags)
      let result
      try {
        result = await service.app.assertTime('trigger '+this.definition.name,
          this.definition.timeout || 10000,
          () => this.doExecute(trig, (...args) => emit.emit(...args)))
        console.log("TRIGGER DONE!", trig)
      } catch (e) {
        console.error(`TRIGGER ${this.definition.name} ERROR`, e.stack)
        throw e
      }
      const events = await emit.commit()
      if(this.definition.waitForEvents)
        await service.app.waitForEvents(reportFinished, events, this.definition.waitForEvents)
      await service.profileLog.end(profileOp)
      return result
    }
  }

}

export default TriggerHandler
