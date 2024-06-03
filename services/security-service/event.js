import crypto from 'crypto'
import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
import { getClientKeysObject, getClientKeysStrings} from './utils.js'

import lcp from '@live-change/pattern'
import lcpDb from '@live-change/pattern-db'
import { request } from 'http'

const securityPatterns = definition.config?.patterns ?? []
lcp.prepareModelForLive(securityPatterns)
//console.log("SECURITY PATTERNS", securityPatterns)

const securityCounters = definition.config?.counters ?? []

let relationsStore
definition.beforeStart(service => {
  relationsStore = lcpDb.relationsStore(app.dao, app.databaseName, 'security_relations')
  relationsStore.createTable()
})

const eventProperties = {
  type: {
    type: String
  },
  keys: {
    type: Object
  },
  properties: {
    type: Object
  },
  timestamp: {
    type: Date
  }
}

const Event = definition.model({
  name: "Event",
  properties: {
    ...eventProperties
  },
  indexes: {
    byKeyTypeAndTimestamp: {
      function: async function(input, output) {
        async function spread(event) {
          for(const key in event.keys) {
            output.put({
              id: `${key}:${JSON.stringify(event.keys[key])}:${event.type}:${event.timestamp}_${event.id}`,
              type: event.type,
              timestamp: event.timestamp
            })
          }
        }
        await input.table('security_Event').onChange(
          (obj, oldObj) => spread(obj)
        )
      }
    }
  }
})

definition.event({
  name: "securityEvent",
  async execute({ event, eventType, keys, newRelations, canceledRelations }) {
    await Event.create({ id: event, type: eventType, keys, timestamp: new Date() })
    const promises = []
    for(const relation of newRelations) {
      promises.push(relationsStore.saveRelation(relation))
    }
    for(const relation of canceledRelations) {
      promises.push(relationsStore.removeRelation(relation))
    }
    await Promise.all(promises)
  }
})


async function processSecurityPatterns(event, time, service) {
  const changes = await lcp.processEvent({...event, time}, securityPatterns, relationsStore.getRelations)
  console.log("PROCESSED EVENT PATTERNS", event, '=>', changes)
  const { newRelations, canceledRelations, actions } = changes

  for (const relation of newRelations) {
    if (relation.prev) {
      for (const prev of relation.prev) {
        if (prev.relation) prev.relation.prev = null
      }
    }
  }

  let promises = []
  for (const relation of newRelations) {
    if (relation.type === 'eq') {
      // will be handled by event
    } else if (relation.type === 'timeout') {
      const id = crypto.createHash('md5').update(event.id + relation.relation).digest('hex')
      promises.push(service.trigger({ type: "createTimer" }, {
        timer: {
          id,
          timestamp: relation.time,
          service: 'security',
          trigger: {
            type: 'handleTimeout',
            data: {
              timeout: relation
            }
          }
        }
      }))
    } else {
      throw new Error(`Relation type ${JSON.stringify(relation.type)} not supported`)
    }
  }

  await Promise.all(promises)
  promises = []

  for (const relation of canceledRelations) {
    const relationModel = securityPatterns.relations[relation.relation]
    if (relationModel.eq) {
      // will be handled by event
    } else if (relationModel.wait) {
      const id = crypto.createHash('md5').update(event.id + relation.relation).digest('hex')
      promises.push(service.trigger({ type: "cancelTimerIfExists" }, {
        timer: id
      }))
    } else {
      throw new Error(`Relation ${JSON.stringify(relation.relation)} not supported`)
    }
  }

  await Promise.all(promises)
  return { newRelations, canceledRelations, actions }
}

async function processSecurityCounters(event, timestamp, service) {
  const now = Date.now()
  const actions = []
  const counters = securityCounters.filter(counter => counter.match.includes(event.type))
  if(counters.length == 0) return
  const counterEventsRequests = []
  for(const counter of counters) {
    const duration = lcp.parseDuration(counter.duration)
    for(const eventType of counter.match) {
      for(const key of counter.keys) {
        const request = counterEventsRequests.find(req => req.type == eventType && req.key == key)
        if(request) {
          request.max = Math.max(request.max, counter.max)
          request.duration = Math.max(request.duration, duration)
        } else {
          counterEventsRequests.push({
            type: eventType,
            key,
            max: counter.max,
            duration
          })
        }
      }
    }
  }
  const indexName = Event.tableName+'_byKeyTypeAndTimestamp'
  //console.log("ALL COUNTER EVENTS REQUESTS", counterEventsRequests)
  const counterEvents = await Promise.all(counterEventsRequests.map(async request => {
    const back = (new Date(now - request.duration - 1000)).toISOString()
    const prefix = `${request.key}:${JSON.stringify(event.keys[request.key])}:${request.type}:`
    console.log("{", prefix)
    const range = {
      gt: prefix + back, // time limited
      lt: prefix + '\xFF',
      reverse: true,
      limit: request.max
    }
    console.log("R", range)
    const events = await app.dao.get(['database', 'indexRange', service.databaseName, indexName, range])
    console.log("RR", events)
    return {
      type: request.type,
      events
    }
  }))
  for(const counter of counters) {
    const duration = lcp.parseDuration(counter.duration)
    const fromTime = (new Date(now - duration)).toISOString()
    let count = 0
    for(const events of counterEvents) {
      if(!counter.match.includes(events.type)) continue
      for(const event of events.events) {
        if(event.timestamp > fromTime) {
          count ++
        }
      }
    }
    if(count + 1 > counter.max) { // +1 for the new event, not added yet
      //console.log("COUNTER FIRE", counter)
      actions.push(...counter.actions)
    }
  }
  return { actions }
}

definition.trigger({
  name: "securityEvent",
  properties: {
    event: {
      type: Object,
      properties: eventProperties
    },
    client: {
      type: Object
    }
  },
  async execute({ event, client, timestamp }, { service }, emit) {
    //console.log("SECURITY EVENT TRIGGERED", arguments[0])
    event.id = event.id || app.generateUid()
    event.time = event.time || timestamp
    const time = (typeof event.time == 'number') ? event.time : new Date(event.time).getTime()

    if(client) {
      event.keys = { ...getClientKeysObject(client), ...event.keys }
    }

    //console.log("PROCESS EVENT", event)
    let [
      { newRelations, canceledRelations, actions: patternsActions },
      { actions: countersActions }
    ] = await Promise.all([
      processSecurityPatterns(event, time, service),
      processSecurityCounters(event, time, service)
    ])

    let promises = []
    const actions = patternsActions.concat(countersActions)

    for(const action of actions) {
      const actionTypeUpperCase = action.type[0].toUpperCase() + action.type.slice(1)
      //console.log("ACTION", JSON.stringify(action, null, '  '))
      promises.push(service.trigger({ type: 'securityAction' + actionTypeUpperCase }, {
        ...action,
        event,
      }))
    }

    await Promise.all(promises)

    emit({
      type: "securityEvent",
      event: event.id,
      eventType: event.type,
      keys: event.keys,
      actions,
      newRelations: newRelations.filter(rel => rel.type == 'eq'),
      canceledRelations: canceledRelations.filter(rel => rel.type == 'eq')
    })

  }
})

definition.view({
  name: 'myCountersState',
  properties: {
    events: {
      type: String
    }
  },
  daoPath({ events }, { client, service }) {
    const keys = getClientKeysObject(client)
    const eventRequests = []
    for(const eventType of events) {
      for(const counter of securityCounters) {
        if(!counter.visible) continue
        if(!counter.match.includes(eventType)) continue
        const duration = lcp.parseDuration(counter.duration)
        for(const keyName in keys) {
          const keyValue = keys[keyName]
          if(keyValue === undefined) continue
          eventRequests.push({
            eventType,
            counter: counter.id,
            duration,
            keyName,
            keyValue,
            max: counter.max
          })
        }
      }
    }
    return ['database', 'query', service.databaseName, `(${
      async (input, output, { eventRequests, indexName } ) => {
        const index = await input.index(indexName)
        
        class Request {
          constructor(eventRequest) {
            this.eventRequest = eventRequest
            
            this.id = eventRequest.counter + ':' + eventRequest.keyName
            this.count = 0
            this.max = this.eventRequest.max
            this.remaining = this.max + 1
            
            this.prefix = `${eventRequest.keyName}:${JSON.stringify(eventRequest.keyValue)}:${eventRequest.eventType}:` 
            this.range = undefined 
            this.indexRange = undefined
            this.fromTime = 0
            this.value = undefined
            this.observer = undefined
            this.oldest = undefined
            this.expire = Infinity
            
            this.loading = false
          }
          async refresh() {
            this.loading = true
            const newFromTime = Date.now() - this.eventRequest.duration
            //output.debug("REFRESH", newFromTime, this.fromTime, newFromTime - this.fromTime)
            if(Math.abs(newFromTime - this.fromTime) > 5000) { // refresh only when time is different by 5s
              //output.debug("OBSERVER REFRESH!")
              this.fromTime = newFromTime
              const newRange = {
                gt: this.prefix + (new Date(this.fromTime)).toISOString(), // time limited
                lt: this.prefix + '\xFF',
                reverse: true,
                limit: this.eventRequest.max
              }
              this.range = newRange
              //output.debug("NEW RANGE", this.range)
              if(this.observer) {
                this.indexRange.unobserve(this.observer)
              }
              //output.debug("OBSERVE RANGE!", this.range)
              this.indexRange = index.range(this.range)
              
              this.observer = await this.indexRange.onChange(async (ind, oldInd) => {
                //output.debug("RANGE CHANGE!", newRange, ind)
                if(!this.loading) {
                  await this.refresh()
                }
              })
            }
            const newValue = await this.indexRange.get()
            this.loading = false
            if(JSON.stringify(this.value) != JSON.stringify(newValue)) {
              this.value = newValue
              if(this.value) {
                this.count = this.value.length
                this.oldest = this.value[this.count - 1]
                this.remaining = this.max - this.count + 1
                this.expire = this.oldest
                    ? (new Date(this.oldest.timestamp)).getTime() + this.eventRequest.duration
                    : Infinity
              }
              await recompute()
            }
          }
        }
        
        const requests = new Array(eventRequests.length)

        let currentTimeout = null
        let expire = Infinity
        async function recompute() {
          //output.debug("RECOMPUTE?")
          for(const request of requests) {
            if(request.value === undefined) return // no recompute until all readed
          }
          //output.debug("RECOMPUTE!")
          let firstExpire = Infinity
          let firstExpireRequest = null
          for(const request of requests) {
            //console.log("REQUEST EXPIRE", request.prefix, request.expire)
            if(request.expire < firstExpire) {
              firstExpire = request.expire
              firstExpireRequest = request
            }
            const { id, count, remaining, max, oldest, value } = request
            output.change({
              id,
              count, remaining, max, 
              oldest: oldest?.timestamp,
              expire: request.expire ? new Date(request.expire) : null,
              //value
            })
          }
          //console.log("FIRST EXPIRE", firstExpire)
          //console.log("LAST EXPIRE", expire)
          if(firstExpire != expire) {
            expire = firstExpire
            if(currentTimeout) { // clears timeout
              currentTimeout()
            }
            expire += 1000 // additional delay
            //console.log("SET TIMEOUT", new Date(expire))
            currentTimeout = output.timeout(expire, () => {
              //output.debug("EXPIRE TIMEOUT!", expire)
              firstExpireRequest.refresh()
            }) // time parameter can be number or date or iso
          }
        }
        
        if(eventRequests.length == 0) return
        for(const i in eventRequests) {
          const eventRequest = eventRequests[i]
          const request = new Request(eventRequest)
          requests[i] = request
          //output.debug("REQUEST", eventRequest, '=>', request)
        }
        await Promise.all(requests.map(async request => {
          await request.refresh()
        }))
      }
    })`, { eventRequests, indexName: Event.tableName + '_byKeyTypeAndTimestamp' }]
  }
})
