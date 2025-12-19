import {randomString, uidGenerator} from '@live-change/uid'

import ReactiveDao from "@live-change/dao"

import ServiceDefinition from "./definition/ServiceDefinition.js"

import Service from "./runtime/Service.js"

import profileLog from "./utils/profileLog.js"

import Dao from "./runtime/Dao.js"
import SessionDao from "./runtime/SessionDao.js"
import LiveDao from "./runtime/LiveDao.js"
import ApiServer from "./runtime/ApiServer.js"

import indexListProcessor from "./processors/indexList.js"
import daoPathView from "./processors/daoPathView.js"
import fetchView from "./processors/fetchView.js"
import accessControl from "./processors/accessControl.js"
import autoValidation from "./processors/autoValidation.js"
import indexCode from "./processors/indexCode.js"
import queryExtensions from "./processors/queryExtensions.js"

import databaseUpdater from "./updaters/database.js"

import accessControlFilter from "./clientSideFilters/accessFilter.js"
import clientSideFilter from "./clientSideFilters/clientSideFilter.js"

import commandExecutor from "./processes/commandExecutor.js"
import triggerExecutor from "./processes/triggerExecutor.js"
import eventListener from './processes/eventListener.js'

import SplitEmitQueue from "./utils/SplitEmitQueue.js"
import SingleEmitQueue from "./utils/SingleEmitQueue.js"

import Debug from 'debug'

const debug = Debug('framework')


import * as utils from './utils.js'
import * as validation from './utils/validation.js'
import { trace, SpanKind, context, propagation } from '@opentelemetry/api'

class App {

  constructor(config = {}) {
    this.config = config
    this.splitEvents = false
    this.shortEvents = false
    this.shortCommands = false
    this.shortTriggers = false

    this.requestTimeout = config?.db?.requestTimeout || 10*1000

    this.defaultProcessors = [
      indexListProcessor,
      queryExtensions,
      daoPathView,
      fetchView,      
      accessControl,
      autoValidation,
      indexCode      
    ]
    this.defaultUpdaters = [
      databaseUpdater
    ]
    this.defaultClientSideFilters = [
      accessControlFilter,
      clientSideFilter
    ]
    this.defaultProcesses = [
      commandExecutor,
      triggerExecutor,
      eventListener
    ]

    this.dao = null

    this.profileLog = profileLog

    this.databaseName = config?.db?.name || 'test'

    this.instanceId = randomString(4)
    this.uidGenerator = uidGenerator(this.instanceId, this.config.uidBorders)

    this.activeTimeouts = new Set()

    this.startedServices = {}
    this.triggerRoutes = {}
    this.globalViews = {}

    this.loggingHelpers = utils.loggingHelpers('live-change/app', '')
    this.tracer = trace.getTracer('live-change/app')
  }

  static app() {
    if(!globalThis.liveChangeFrameworkApp) {
      globalThis.liveChangeFrameworkApp = new App()
    }
    return globalThis.liveChangeFrameworkApp
  }

  static utils = utils
  static validation = validation
  static rangeProperties = utils.rangeProperties
  static encodeIdentifier = utils.encodeIdentifier
  static extractRange = utils.extractRange
  static isomorphic = utils.isomorphic
  static computeDefaults = utils.computeDefaults
  static computeUpdates = utils.computeUpdates

  createServiceDefinition( definition ) {
    const sourceConfig = this.config && this.config.services && this.config.services.find
      && this.config.services.find(c => c.name === definition.name)
    const config = { ...sourceConfig, module: null }
    return new ServiceDefinition({ ...definition, config })
  }

  processServiceDefinition( sourceService, processors ) {
    if(!processors) processors = this.defaultProcessors
    processors = processors.slice()
    function processUse(service) {
      if(service && service.use) {
        for(let i = service.use.length - 1; i >= 0; i --) { // apply in reverse order
          const plugin = service.use[i]
          processUse(plugin)
        }
      }
      processors.unshift(...service.processors)
    }
    processUse(sourceService)
    //console.log("FOUND PROCESSORS", processors.length)
    processors = processors.filter(function(item, pos, self) {
      return self.indexOf(item) === pos
    })
    processors = processors.map(p => {
      if(typeof p == 'function') {
        return {
          process: p
        }
      } else {
        return p
      }
    })
    processors.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    //console.log("RUNNING PROCESSORS", processors.length)
    for(let processor of processors) {
      //console.log("PROCESSOR", processor.toString())
      processor.process(sourceService, this)
    }
  }

  computeChanges( oldServiceJson, newService ) {
    return newService.computeChanges(oldServiceJson)
  }

  async applyChanges(changes, service, updaters, force) {
    debug("APPLY CHANGES", JSON.stringify(changes, null, '  '))
    updaters = updaters || this.defaultUpdaters
    for(let updater of updaters) {
      await updater(changes, service, this, force)
    }
  }

  async getOldServiceDefinition( serviceName ) {
    let oldServiceJson = await this.dao.get(['database', 'tableObject', this.databaseName, 'services', serviceName])
    if(!oldServiceJson) {
      oldServiceJson = this.createServiceDefinition({name: serviceName}).toJSON()
    }
    return oldServiceJson
  }

  async updateService( service, { updaters, force } = {}) {
    const profileOp = await this.profileLog.begin({
      operation: "updateService", serviceName: service.name, force
    })

    this.dao.request(['database', 'createTable'], this.databaseName, 'services').catch(e => 'ok')
    let oldServiceJson = await this.getOldServiceDefinition(service.name)

    let changes = this.computeChanges(oldServiceJson, service)
    //console.log("OLD SERVICE", JSON.stringify(oldServiceJson, null, '  '))
    //console.log("NEW SERVICE", JSON.stringify(service.toJSON(), null, '  '))
    //console.log("CHANGES", JSON.stringify(changes, null, '  '))

    /// TODO: chceck for overwriting renames, solve by addeding temporary names

    await this.applyChanges(changes, service, updaters || this.defaultUpdaters, force)
    await this.dao.request(['database', 'put'], this.databaseName, 'services',
        { id: service.name , ...service })

    await this.profileLog.end(profileOp)
  }

  async startService( serviceDefinition, config = {}) {
    if(!config.processes) config.processes = this.defaultProcesses
    console.log("Starting service", serviceDefinition.name, "!")
    const profileOp = await this.profileLog.begin({
      operation: "startService", serviceName: serviceDefinition.name, config
    })
    if(!(serviceDefinition instanceof ServiceDefinition))
      serviceDefinition = new ServiceDefinition(serviceDefinition)
    let service = new Service(serviceDefinition, this)
    for(const viewName in serviceDefinition.views) {
      const viewDefinition = serviceDefinition.views[viewName]
      if(viewDefinition.global) this.globalViews[viewName] = service.views[viewName]
    }
    await service.start(config)
    console.log("service started", serviceDefinition.name, "!")
    await this.profileLog.end(profileOp)
    this.startedServices[serviceDefinition.name] = service

    return service
  }

  async createDao( config, clientData ) {
    return new Dao(config, clientData)
  }

  async createReactiveDao( config, clientData ) {
    return new Dao(config, clientData)
  }

  async createApiServer( config ) {
    return new ApiServer({ ...config, app: this })
  }
  async createSessionApiServer( config ) {
    return new ApiServer({ ...config, app: this }, SessionDao)
  }
  async createLiveApiServer( config ) {
    return new ApiServer({ ...config, app: this }, LiveDao)
  }

  generateUid() {
    return this.uidGenerator()
  }

  async clientSideDefinition( service, client, filters ) {
    if(!service.clientSideDefinition) {
      service.clientSideDefinition = JSON.stringify(service.definition.toJSON(), (key, value) => {
        if (value && typeof value == 'object' && value.function && value.isomorphic) return {
          function: value.function.toString(),
          isomorphic: value.isomorphic
        }
        return value
      })
    }
    let definition = JSON.parse(service.clientSideDefinition)
    delete definition.use
    if(!filters) filters = this.defaultClientSideFilters
    for(let filter of filters) await filter(service, definition, this, client)
    for(let filter of service.definition.clientSideFilters) await filter(service, definition, this, client)
    return definition
  }

  async trigger(trigger, data) {
    const triggerSpan = this.tracer.startSpan('callTrigger', { kind: SpanKind.INTERNAL })
    triggerSpan.setAttribute('trigger', trigger)
    triggerSpan.setAttribute('data', data)
    try {  
      if(!trigger) throw new Error("trigger must have type")
      if(typeof trigger !== 'object') throw new Error("trigger must be object")
      if(typeof trigger.type !== 'string') throw new Error("trigger type must be string")
      if(!data) throw new Error("trigger must have data")
      if(typeof data !== 'object') throw new Error("trigger must be object")
      if(trigger.service) return await this.triggerService(trigger, data, true)
      if(this.shortTriggers) {
        const triggers = this.triggerRoutes[trigger.type] /// TODO: check if it is right
        return await Promise.all(triggers.map(t => t.execute(data)))
      }
      const profileOp = await this.profileLog.begin({
        operation: "callTrigger", triggerType: trigger.type, id: data.id, by: data.by
      })
      const routes = await this.dao.get(['database', 'tableRange', this.databaseName, 'triggerRoutes',
        { gte: trigger.type+'=', lte: trigger.type+'=\xFF\xFF\xFF\xFF' }])
      this.loggingHelpers.log("TRIGGER ROUTES", trigger.type, '=>', routes.map(r => r.service).join(', '))
      let promises = []
      for(const route of routes) {
        promises.push(this.triggerService({ ...trigger, service: route.service }, { ...data }, true))
      }
      const promise = Promise.all(promises)
      await this.profileLog.endPromise(profileOp, promise)
      const result = (await promise).flat()
      this.loggingHelpers.log("TRIGGER FINISHED!", result)
      return result
    } finally {
      triggerSpan.end()
    }
  }

  async triggerService(trigger, data, returnArray = false) {
    const triggerSpan = this.tracer.startSpan('callTriggerService', { kind: SpanKind.INTERNAL })
    triggerSpan.setAttribute('trigger', trigger)
    triggerSpan.setAttribute('data', data)
    triggerSpan.setAttribute('service', trigger.service)

    try {
      if(!trigger.service) throw new Error("trigger must have service")
      if(typeof trigger !== 'object') throw new Error("trigger must be object")
      if(typeof trigger.service !== 'string') throw new Error("trigger service must be string")
      if(typeof trigger.type !== 'string') throw new Error("trigger type must be string")
      trigger.data = data
      if(!trigger.data) throw new Error("trigger must have data")
      if(typeof trigger.data !== 'object') throw new Error("trigger must be object")
      if(this.shortTriggers) {
        const service = this.startedServices[trigger.service]
        const triggers = service.triggers[trigger.type]
        if(!triggers) return []
        const result = await Promise.all(triggers.map(t => t.execute(data)))
        if(!returnArray && Array.isArray(result) && result.length === 1) return result[0]
        return result
      }
      if(!trigger.id) trigger.id = this.generateUid()
      trigger.state = 'new'
      if(!trigger.timestamp) trigger.timestamp = (new Date()).toISOString()

      const profileOp = await this.profileLog.begin({
        operation: "callTriggerService", triggerType: trigger.type, service: trigger.service, triggerId: trigger.id, by: data.by
      })

      const triggersTable = this.splitCommands ? `${this.name}_triggers` : 'triggers'
      const objectObservable = this.dao.observable(
          ['database', 'tableObject', this.databaseName, triggersTable, trigger.id],
          ReactiveDao.ObservableValue
      )

      propagation.inject(context.active(), trigger._trace)
      
      await this.dao.request(['database', 'update', this.databaseName, triggersTable, trigger.id, [{
        op: 'conditional',
        conditions: [{ test: 'notExist', property: 'type' }],
        operations: [{ op: 'reverseMerge', value: trigger }],
      }]])
      let observer
      const promise = new Promise((resolve, reject) => {
        observer = (signal, value) => {
          if(signal !== 'set') return reject('unknownSignal')
          if(!value) return
          if(value.state === 'done') return resolve(value.result)
          if(value.state === 'failed') return reject(value.error)
        }
        objectObservable.observe(observer)
      }).finally(() => {
        objectObservable.unobserve(observer)
      })
      await this.profileLog.endPromise(profileOp, promise)

      const result = await promise
      if(!returnArray && Array.isArray(result) && result.length === 1) return result[0]
      return result
    } finally {
      triggerSpan.end()
    }
  }
  async command(data, requestTimeout) {
    const commandSpan = this.tracer.startSpan('callCommand', { kind: SpanKind.INTERNAL })
    commandSpan.setAttribute('command', data)
    commandSpan.setAttribute('requestTimeout', requestTimeout)
    try {

      if(!data.id) data.id = this.generateUid()
      if(!data.service) throw new Error("command must have service")
      if(!data.type) throw new Error("command must have type")
      if(!data.timestamp) data.timestamp = (new Date()).toISOString()
      data.state = 'new'

      if(this.shortCommands) {
        const command = data
        const service = this.startedServices[data.service]
        const action = service.actions[data.type]
        const queuedBy = action.definition.queuedBy        
        if(queuedBy) {
          const profileOp = await service.profileLog.begin({
            operation: 'queueCommand', commandType: actionName,
            commandId: command.id, client: command.client
          })
          const keyFunction = typeof queuedBy == 'function' ? queuedBy : (
            Array.isArray(queuedBy) ? (c) => JSON.stringify(queuedBy.map(k => c[k])) :
              (c) => JSON.stringify(c[queuedBy]))

          const _trace = {}
          propagation.inject(context.active(), _trace)

          const routine = () => service.profileLog.profile({
            operation: 'runCommand', commandType: actionName,
            commandId: command.id, client: command.client
          }, async () => {
            propagation.extract(context.active(), _trace)
            const reportFinished = action.definition.waitForEvents ? command.id : undefined
            propagation.inject(context.active(), _trace)
            const flags = {commandId: command.id, reportFinished, _trace}
            const emit = (!this.splitEvents || this.shortEvents)
              ? new SingleEmitQueue(service, flags)
              : new SplitEmitQueue(service, flags)

            const result = await service.app.assertTime('command ' + action.definition.name,
              action.definition.timeout || 10000,
              () => action.runCommand(command, (...args) => emit.emit(...args)), command)
            if(this.shortEvents) {
              const bucket = {}
              const eventsPromise = Promise.all(emit.emittedEvents.map(event => {
                const service = this.startedServices[event.service]
                const handler = service.events[event.type]
                service.exentQueue.queue(() => handler.execute(event, bucket))
              }))
              if (action.definition.waitForEvents) await eventsPromise
            } else {
              const events = await emit.commit()
              if (action.definition.waitForEvents)
                await service.app.waitForEvents(reportFinished, events, action.definition.waitForEvents)
            }
            return result
          })
          routine.key = keyFunction(command)
          const promise = service.keyBasedExecutionQueues.queue(routine)
          await service.profileLog.endPromise(profileOp, promise)
          return promise
        } else {
          const result = await service.app.assertTime('command ' + action.definition.name,
            action.definition.timeout || 10000,
            () => action.runCommand(command, (...args) => emit.emit(...args)), command)
          if(this.shortEvents) {
            const bucket = {}
            console.log("emit", emit)
            const eventsPromise = Promise.all(emit.emittedEvents.map(event => {
              const service = this.startedServices[event.service]
              const handler = service.events[event.type]
              service.exentQueue.queue(() => handler.execute(event, bucket))
            }))
            if (action.definition.waitForEvents) await eventsPromise
          } else {
            const events = await emit.commit()
            if (action.definition.waitForEvents)
              await service.app.waitForEvents(reportFinished, events, action.definition.waitForEvents)
          }
          return result
        }
      } else { // queue and observe command execution        
        const profileOp = await this.profileLog.begin({
          operation: "callCommand", commandType: data.type, service: data.service,
          commandId: data.id, by: data.by, client: data.client
        })

        const commandsTable = this.splitCommands ? `${data.service}_commands` : 'commands'
        const objectObservable = this.dao.observable(
          ['database', 'tableObject', this.databaseName, commandsTable, data.id],
          ReactiveDao.ObservableValue
        )

        const _trace = {}
        propagation.inject(context.active(), _trace)
        data._trace = _trace
 
        await this.dao.request(['database', 'update', this.databaseName, commandsTable, data.id, [{
          op: 'conditional',
          conditions: [{ test: 'notExist', property: 'type' }],
          operations: [{ op: 'reverseMerge', value: data }],
        }]])
        let observer
        const promise = new Promise((resolve, reject) => {
          observer = (signal, value) => {
            if (signal !== 'set') return reject('unknownSignal')
            if (!value) return
            if (value.state === 'done') return resolve(value.result)
            if (value.state === 'failed') return reject(value.error)
          }
          objectObservable.observe(observer)
          if (!requestTimeout) {
            requestTimeout = this.requestTimeout
          }
          if (requestTimeout) {
            const timeout = setTimeout(() => {
              this.activeTimeouts.delete(timeout)
              reject('timeout')
            }, requestTimeout)
            this.activeTimeouts.add(timeout)
          }
        }).finally(() => {
          objectObservable.unobserve(observer)
        })

        await this.profileLog.endPromise(profileOp, promise)
        return promise
      }
    } finally {
      commandSpan.end()
    }
  }

  async emitEvents(service, events, flags = {}) {
    for(let event of events) {
      if(!event.service) event.service = service
      if(!event._trace) {
        event._trace = {}
        propagation.inject(context.active(), event._trace)
      }
    }
    if(this.splitEvents) {
      let promises = []
      const eventsByService = new Map()
      for(const event of events) {
        let serviceEvents = eventsByService.get(event.service)
        if(!serviceEvents) {
          serviceEvents = []
          eventsByService.set(event.service, serviceEvents)
        }
        serviceEvents.push(event)
      }
      for(const [service, serviceEvents] of eventsByService.entries()) {
        promises.push(this.dao.request(['database', 'putLog'], this.databaseName,
            service+'_events', { type: 'bucket', serviceEvents, ...flags }))
      }
      return Promise.all(promises)
    } else {
      return this.dao.request(['database', 'putLog'], this.databaseName,
          'events', { type: 'bucket', events, ...flags })
    }
  }

  async waitForEvents(reportId, events, timeout) {
    if(events.length === 0) {
      this.loggingHelpers.log("no events, no need to wait", reportId)
      return
    }
    const [action, id] = reportId.split('_')
    const commandId = id

    const waitForEventsSpan = this.tracer.startSpan('waitForEvents', { kind: SpanKind.INTERNAL })
    waitForEventsSpan.setAttribute('reportId', reportId)
    waitForEventsSpan.setAttribute('events', events)
    waitForEventsSpan.setAttribute('timeout', timeout)

    const profileOp = await this.profileLog.begin({
      operation: "waitForEvents", action: action, commandId, reportId, events, timeout
    })
    const promise = new Promise((resolve, reject) => {
      let done = false
      let finishedEvents = []
      const handleError = (message) => {
        let errorMessage = `waitForEvents error: ${message}`        
        const eventsNotDone = events.filter(event => finishedEvents.find(e => e.id === event.id))
        if(eventsNotDone.length > 0) {
          errorMessage += "\n  pending events:"
          for(const event of eventsNotDone) {
            errorMessage += `\n    ${event.id} - type: ${event.type}`
          }
        }
        this.loggingHelpers.error(errorMessage)
        reject(message)
        done = true
      }
      const observable = this.dao.observable(
          ['database', 'tableObject', this.databaseName, 'eventReports', reportId]
      )
      const reportsObserver = (signal, data) => {
        if(signal !== 'set') {
          handleError(`unknown signal ${signal} with data: ${data}`)
        }
        if(data == null) return /// wait for real data
        if(data.finished) {
          finishedEvents = data.finished
          if(finishedEvents.length >= events.length) {
            const eventsNotDone = events.filter(event => data.finished.find(e => e.id === event.id))
            if(eventsNotDone.length !== 0) {
              const eventsDone = events.filter(event => !data.finished.find(e => e.id === event.id))
              let errorMessage = "waitForEvents - finished events does not match!"
              errorMessage += "\n  finished events:"
              for(const event of eventsDone) {
                errorMessage += `\n    ${event.id} - type: ${event.type}`
              }
              errorMessage += "\n  pending events:"
              for(const event of eventsNotDone) {
                errorMessage += `\n    ${event.id} - type: ${event.type}`
              }
              this.loggingHelpers.error(errorMessage)
            } else {
              this.loggingHelpers.log("waiting for events finished", reportId)
              resolve('finished')
              observable.unobserve(reportsObserver)
            }
          }
        }
      }
      this.loggingHelpers.log("waiting for events", reportId)
      observable.observe(reportsObserver)
      if(Number.isFinite(timeout)) {
        setTimeout(() => {
          if(done) return
          observable.unobserve(reportsObserver)
          this.loggingHelpers.error("events timeout", reportId)
          handleError('timeout')
        }, timeout)
      }
    })
    await this.profileLog.endPromise(profileOp, promise)    
    promise.then(() => {
      waitForEventsSpan.end()
    })
    promise.catch((error) => {
      this.loggingHelpers.error("waitForEvents error", error)
      waitForEventsSpan.end()
      throw error
    })
    return promise
  }

  async emitEventsAndWait(service, events, flags = {}) {
    const reportId = 'trigger_' + this.generateUid()
    await this.emitEvents(service, events, { reportFinished: reportId, ...flags })
    return await this.waitForEvents(reportId, events)
  }

  async assertTime(taskName, duration, task, ...data) {
    const profileOp = await this.profileLog.begin({ operation: 'assertTime', taskName })
    const taskTimeout = setTimeout(() => {
      console.log(`TASK ${taskName} TIMEOUT`, ...data)
      this.profileLog.end({ ...profileOp, result: "timeout" })
    }, duration)
    try {
      const result = await task()
      return result
    } finally {
      clearTimeout(taskTimeout)
      await this.profileLog.end({ ...profileOp, result: "done" })
    }
  }


  query(query, params) {
    return ['database', 'query', this.databaseName, `(${ query })`, params]
  }

  queryGet(query, params) {
    return this.dao.get(this.query(query, params))
  }

  queryObservable(query, params) {
    return this.dao.observable(this.query(query, params))
  }

  queryObject(query, params) {
    return ['database', 'queryObject', this.databaseName, `(${ query })`, params]
  }

  queryObjectGet(query, params) {
    return this.dao.get(this.queryObject(query, params))
  }

  queryObjectObservable(query, params) {
    return this.dao.observable(this.queryObject(query, params))
  }

  async close() {
    for(const timeout of this.activeTimeouts) {
      clearTimeout(timeout)
    }
    this.dao.dispose()
  }


  serviceViewObservable(serviceName, viewName, params) {
    const service = this.startedServices[serviceName]
    if(!service) throw new Error(
      `Service ${serviceName} not found, available services: ${Object.keys(this.startedServices).join(', ')}`
    )
    const view = service.views[viewName]
    if(!view) throw new Error(`View ${viewName} not found in service ${serviceName}`)
    const result = view.observable(params, { internal: true, roles: ['admin'] })
    return result.then ? new ReactiveDao.ObservablePromiseProxy(result) : result
  }

  async serviceViewGet(serviceName, viewName, params) {
    const service = this.startedServices[serviceName]
    if(!service) throw new Error(
      `Service ${serviceName} not found, available services: ${Object.keys(this.startedServices).join(', ')}`
    )
    const view = service.views[viewName]
    if(!view) throw new Error(`View ${viewName} not found in service ${serviceName}`)
    return await view.get(params, { internal: true, roles: ['admin'] })
  }

  viewObservable(viewName, params) {
    const view = this.globalViews[viewName]
    if(!view) throw new Error(`Global view ${viewName} not found`)
    const result = view.observable(params, { internal: true, roles: ['admin'] })
    return result.then ? new ReactiveDao.ObservablePromiseProxy(result) : result
  }

  async viewGet(viewName, params) {
    const view = this.globalViews[viewName]
    if(!view) throw new Error(`Global view ${viewName} not found`)
    return await view.get(params, { internal: true, roles: ['admin'] })
  }

  async cachedTask(taskDescription, expireAfter, task) {
    /// Parse expireAfter in format "10s", "1m", "1h", "1d"
    const expireAfterMs = utils.parseDuration(expireAfter)    
    const utf8 = new TextEncoder().encode(JSON.stringify(taskDescription))
    const taskDescriptionHashBinary = await crypto.subtle.digest('SHA-256', utf8)
    const taskDescriptionHash = Array.from(new Uint8Array(taskDescriptionHashBinary))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    //console.log("taskDescriptionHash", taskDescriptionHash)
    let cacheEntry = await this.dao.get(['database', 'tableObject', this.databaseName, 'cache', taskDescriptionHash])
    if(!cacheEntry || cacheEntry.createdAt < new Date(Date.now() - expireAfterMs).toISOString()) {
      //console.log("cache miss", taskDescription)
      const result = await task()
      const expiresAt = new Date(Date.now() + expireAfterMs).toISOString()
      cacheEntry = {
        id: taskDescriptionHash,
        createdAt: new Date().toISOString(),
        expiresAt,
        result
      }
      await this.dao.request(['database', 'put'], this.databaseName, 'cache', cacheEntry)
    } else { // extend cache entry expiration
      //console.log("cache hit", taskDescription)
      const newExpiresAt = new Date(new Date(cacheEntry.createdAt).getTime() + expireAfterMs).toISOString()
      if(cacheEntry.expiresAt < newExpiresAt) {
        cacheEntry.expiresAt = newExpiresAt
        await this.dao.request(['database', 'put'], this.databaseName, 'cache', cacheEntry)
      }
    }
    return cacheEntry.result
  }

  async cacheGet(taskDescription, expireAfter) {
    const expireAfterMs = utils.parseDuration(expireAfter)
    const utf8 = new TextEncoder().encode(JSON.stringify(taskDescription))
    const taskDescriptionHashBinary = await crypto.subtle.digest('SHA-256', utf8)
    const taskDescriptionHash = Array.from(new Uint8Array(taskDescriptionHashBinary))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    const cacheEntry = await this.dao.get(['database', 'tableObject', this.databaseName, 'cache', taskDescriptionHash])
    if(!cacheEntry || cacheEntry.createdAt < new Date(Date.now() - expireAfterMs).toISOString()) {
      return null
    }
    return cacheEntry.result
  }

  async cachePut(taskDescription, result) {
    const utf8 = new TextEncoder().encode(JSON.stringify(taskDescription))
    const taskDescriptionHashBinary = await crypto.subtle.digest('SHA-256', utf8)
    const taskDescriptionHash = Array.from(new Uint8Array(taskDescriptionHashBinary))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    const cacheEntry = {
      id: taskDescriptionHash,
      createdAt: new Date().toISOString(),
      result
    }
    await this.dao.request(['database', 'put'], this.databaseName, 'cache', cacheEntry)
  }

}

export default App
