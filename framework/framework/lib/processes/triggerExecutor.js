import KeyBasedExecutionQueues from '../utils/KeyBasedExecutionQueues.js'
import CommandQueue from '../utils/CommandQueue.js'
import SingleEmitQueue from '../utils/SingleEmitQueue.js'
import SplitEmitQueue from '../utils/SplitEmitQueue.js'

import { context, propagation, trace } from '@opentelemetry/api'
import { SpanKind } from '@opentelemetry/api'
const tracer = trace.getTracer('live-change:triggerExecutor')

async function setSpanAttributes(span, trig, service) {
  span.setAttribute('trigger', trig)
  span.setAttribute('service', service.name)
}

async function startTriggerExecutor(service, config) {
  if(!config.runCommands) return

  service.keyBasedExecutionQueues = service.keyBasedExecutionQueues || new KeyBasedExecutionQueues(r => r.key)

  if(service.app.shortTriggers) {
    for (let triggerName in service.triggers) {
      service.app.triggerRoutes[triggerName] = service.app.triggerRoutes[triggerName] || []
      for(let trigger of service.triggers[triggerName]) {
        service.app.triggerRoutes[triggerName].push({ service, trigger })
      }
    }
    return
  }

  await service.dao.request(['database', 'createTable'], service.databaseName, 'triggerRoutes').catch(e => 'ok')

  service.triggerQueue = new CommandQueue(service.dao, service.databaseName,
      service.app.splitTriggers ? `${service.name}_triggers` : 'triggers', service.name, config.runCommands)
  for (let triggerName in service.triggers) {
    const triggers = service.triggers[triggerName]
    await service.dao.request(['database', 'put'], service.databaseName, 'triggerRoutes',
        { id: triggerName + '=>' + service.name, trigger: triggerName, service: service.name })
    service.triggerQueue.addCommandHandler(triggerName,
      async (trig) => {
        if(trig._trace) {
          propagation.extract(context.active(), trig._trace)
        }
        const triggerSpan = tracer.startSpan('handleTriggerCall', { kind: SpanKind.INTERNAL })
        setSpanAttributes(triggerSpan, trig, service)
        try {
          return await Promise.all(triggers.map( trigger => trigger.execute(trig, service) ))
        } finally {
          triggerSpan.end()
        }
      }
    )
  }

  service.triggerQueue.start()
}

export default startTriggerExecutor
