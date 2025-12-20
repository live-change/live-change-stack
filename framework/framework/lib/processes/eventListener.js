import EventSourcing from '../utils/EventSourcing.js'

import Debug from 'debug'
const debug = Debug("framework:eventListener")

import { context, propagation, trace } from '@opentelemetry/api'
import { SpanKind } from '@opentelemetry/api'
const tracer = trace.getTracer('live-change:eventListener')

import { expandObjectAttributes } from '../utils.js'

async function spanAttributes(ev, service) {
  return {
    ...expandObjectAttributes(ev, 'event'),
    service: service.name
  }
}

async function startEventListener(service, config) {
  if(!config.handleEvents) return

  if(service.app.splitEvents) {
    service.eventSourcing = new EventSourcing(service.dao, service.databaseName,
        'events_'+service.name, service.name,
        { filter: (event) => event.service == service.name }, config.handleEvents)
  } else {
    service.eventSourcing = new EventSourcing(service.dao, service.databaseName,
        'events', service.name,
        { filter: (event) => event.service == service.name }, config.handleEvents)
  }

  for (let eventName in service.events) {
    const event = service.events[eventName]
    service.eventSourcing.addEventHandler(eventName, async (ev, bucket) => {
      if(ev._trace) {
        propagation.extract(context.active(), ev._trace)
      }
      return tracer.startActiveSpan('handleEvent:'+service.name+'.'+eventName, { 
        kind: SpanKind.INTERNAL, 
        attributes: spanAttributes(ev, service) 
      }, async (handleSpan) => {        
        try {
          return await service.profileLog.profile({ operation: "handleEvent", eventName, id: ev.id,
              bucketId: bucket.id, triggerId: bucket.triggerId, commandId: bucket.commandId },
            () => {
              debug("EXECUTING EVENT", ev)
              return event.execute(ev, bucket)
            }
          )
        } finally {
          handleSpan.end()
        }
      })
    })
    service.eventSourcing.onBucketEnd = async (bucket, handledEvents) => {
      if(bucket.reportFinished && handledEvents.length > 0) {
        await service.dao.request(['database', 'update'], service.databaseName, 'eventReports', bucket.reportFinished,[
          { op: "mergeSets", property: 'finished', values: handledEvents.map(ev => ({ id: ev.id, type: ev.type })) }
        ])
      }
    }
  }

  service.eventSourcing.start()
}

export default startEventListener
