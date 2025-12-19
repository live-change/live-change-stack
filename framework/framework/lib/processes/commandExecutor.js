import KeyBasedExecutionQueues from '../utils/KeyBasedExecutionQueues.js'
import CommandQueue from '../utils/CommandQueue.js'
import SingleEmitQueue from '../utils/SingleEmitQueue.js'
import SplitEmitQueue from '../utils/SplitEmitQueue.js'

import { context, propagation, trace } from '@opentelemetry/api'
import { SpanKind } from '@opentelemetry/api'
const tracer = trace.getTracer('live-change:commandExecutor')

async function setSpanAttributes(span, command, service, action) {
  span.setAttribute('command', command)
  span.setAttribute('service', service.name)
  span.setAttribute('action.name', action.name)        
  span.setAttribute('action.definition.waitForEvents', action.definition.waitForEvents)
  span.setAttribute('action.definition.timeout', action.definition.timeout)
}

async function startCommandExecutor(service, config) {
  if(!config.runCommands) return

  service.keyBasedExecutionQueues = service.keyBasedExecutionQueues || new KeyBasedExecutionQueues(r => r.key)

  if(service.app.shortCommands) return

  service.commandQueue = new CommandQueue(service.dao, service.databaseName,
      service.app.splitCommands ? `${service.name}_commands` : 'commands', service.name, config.runCommands)

  for (let actionName in service.actions) {
    const action = service.actions[actionName]
    if (action.definition.queuedBy) {
      const queuedBy = action.definition.queuedBy
      const keyFunction = typeof queuedBy == 'function' ? queuedBy : (
          Array.isArray(queuedBy) ? (c) => JSON.stringify(queuedBy.map(k => c[k])) :
              (c) => JSON.stringify(c[queuedBy]))
      service.commandQueue.addCommandHandler(actionName, async (command) => {
        if(command._trace) {
          propagation.extract(context.active(), command._trace)
        }
        const queueSpan = tracer.startSpan('queueCommand', { root: !command._trace })        
        setSpanAttributes(queueSpan, command, service, action)

        const queueContext = context.active()
        
        const profileOp = await service.profileLog.begin({
          operation: 'queueCommand', commandType: actionName,
          commandId: command.id, client: command.client
        })
        
        const routine = () => service.profileLog.profile({
          operation: 'runCommand', commandType: actionName,
          commandId: command.id, client: command.client
        }, async () => {

          const handleSpan = tracer.startSpan('handleCommand', { kind: SpanKind.INTERNAL }, queueContext)
          setSpanAttributes(handleSpan, command, service, action)

          const _trace = {}
          propagation.inject(context.active(), _trace)
          const reportFinished = action.definition.waitForEvents ? 'command_' + command.id : undefined
          const flags = { commandId: command.id, reportFinished, _trace }
          const emit = (!service.app.splitEvents || this.shortEvents)
            ? new SingleEmitQueue(service, flags)
            : new SplitEmitQueue(service, flags)
          
          const result = await service.app.assertTime('command ' + action.definition.name,
              action.definition.timeout || 10000,
              async () => action.runCommand(command, (...args) => emit.emit(...args)), command)           

          const handleEventsSpan = tracer.startSpan('handleEvents', { kind: SpanKind.INTERNAL }, queueContext)
          setSpanAttributes(handleEventsSpan, command, service, action)
          if(service.app.shortEvents) {            
            const bucket = {}
            const eventsPromise = Promise.all(emit.emittedEvents.map(event => {
              const handlerService = service.app.startedServices[event.service]
              const handler = handlerService.events[event.type]
              handlerService.exentQueue.queue(() => handler.execute(event, bucket))
            }))
            if (action.definition.waitForEvents) await eventsPromise
          } else {
            const events = await emit.commit()            
            if (action.definition.waitForEvents)
              await service.app.waitForEvents(reportFinished, events, action.definition.waitForEvents)
          }
          handleEventsSpan.end()
          handleSpan.end()
          queueSpan.end()
          return result
        })
        routine.key = keyFunction(command)
        const promise = service.keyBasedExecutionQueues.queue(routine)
        await service.profileLog.endPromise(profileOp, promise)
        return promise
      })
    } else {
      service.commandQueue.addCommandHandler(actionName,
          (command) => service.profileLog.profile({
            operation: 'runCommand', commandType: actionName,
            commandId: command.id, client: command.client
          }, async () => {
            if(command._trace) {
              propagation.extract(context.active(), command._trace)
            }
            const handleSpan = tracer.startSpan('handleCommand', { kind: SpanKind.INTERNAL })
            setSpanAttributes(handleSpan, command, service, action)

            const handleContext = context.active()

            const _trace = {}
            propagation.inject(context.active(), _trace)
            const reportFinished = action.definition.waitForEvents ? 'command_' + command.id : undefined
            const flags = { commandId: command.id, reportFinished, _trace }
            const emit = (!service.app.splitEvents || this.shortEvents)
              ? new SingleEmitQueue(service, flags)
              : new SplitEmitQueue(service, flags)
            const result = await service.app.assertTime('command ' + action.definition.name,
                action.definition.timeout || 10000,
                () => action.runCommand(command, (...args) => emit.emit(...args)), command)

            const handleEventsSpan = tracer.startSpan('emitEvents', { kind: SpanKind.INTERNAL })
            setSpanAttributes(handleEventsSpan, command, service, action)   
            if(service.app.shortEvents) {
              const bucket = {}
              const eventsPromise = Promise.all(emit.emittedEvents.map(event => {
                const handlerService = service.app.startedServices[event.service]
                const handler = handlerService.events[event.type]
                handlerService.exentQueue.queue(() => handler.execute(event, bucket))
              }))
              if (action.definition.waitForEvents) await eventsPromise
            } else {
              const events = await emit.commit()
              if (action.definition.waitForEvents)
                await service.app.waitForEvents(reportFinished, events, action.definition.waitForEvents)
            }
            handleEventsSpan.end()
            handleSpan.end()
            return result
          })
      )

    }
  }

  service.commandQueue.start()
}

export default startCommandExecutor
