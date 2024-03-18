import {randomString, uidGenerator} from '@live-change/uid'

import ReactiveDao from "@live-change/dao"

import ServiceDefinition from "./definition/ServiceDefinition.js"

import Service from "./runtime/Service.js"

import profileLog from "./utils/profileLog.js"

import Dao from "./runtime/Dao.js"
import SessionDao from "./runtime/SessionDao.js"
import LiveDao from "./runtime/LiveDao.js"
import ApiServer from "./runtime/ApiServer.js"

import reverseRelationProcessor from "./processors/reverseRelation.js"
import indexListProcessor from "./processors/indexList.js"
import crudGenerator from "./processors/crudGenerator.js"
import draftGenerator from "./processors/draftGenerator.js"
import daoPathView from "./processors/daoPathView.js"
import fetchView from "./processors/fetchView.js"
import accessControl from "./processors/accessControl.js"
import autoValidation from "./processors/autoValidation.js"
import indexCode from "./processors/indexCode.js"

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

class App {

  constructor(config = {}) {
    this.config = config
    this.splitEvents = false
    this.shortEvents = false
    this.shortCommands = false
    this.shortTriggers = false

    this.requestTimeout = config?.db?.requestTimeout || 10*1000

    this.defaultProcessors = [
      crudGenerator,
      draftGenerator,
      reverseRelationProcessor,
      indexListProcessor,
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
  }

  createServiceDefinition( definition ) {
    const sourceConfig = this.config && this.config.services && this.config.services.find
      && this.config.services.find(c => c.name == definition.name)
    const config = { ...sourceConfig, module: null }
    return new ServiceDefinition({ ...definition, config })
  }

  processServiceDefinition( sourceService, processors ) {
    if(!processors) processors = this.defaultProcessors
    processors = processors.slice()
    function processUse(service) {
      if(service && service.use) {
        for(const plugin of service.use) {
          processUse(plugin)
        }
      }
      processors.unshift(...service.processors)
    }
    processUse(sourceService)
    //console.log("FOUND PROCESSORS", processors.length)
    processors = processors.filter(function(item, pos, self) {
      return self.indexOf(item) == pos
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

  async updateService( service, { updaters, force } = {}) {
    const profileOp = await this.profileLog.begin({
      operation: "updateService", serviceName: service.name, force
    })

    this.dao.request(['database', 'createTable'], this.databaseName, 'services').catch(e => 'ok')
    let oldServiceJson = await this.dao.get(['database', 'tableObject', this.databaseName, 'services', service.name])
    if(!oldServiceJson) {
      oldServiceJson = this.createServiceDefinition({name: service.name}).toJSON()
    }
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
    await service.start(config)
    console.log("service started", serviceDefinition.name, "!")
    await this.profileLog.end(profileOp)
    this.startedServices[serviceDefinition.name] = service

    for(const viewName in serviceDefinition.views) {
      const view = serviceDefinition.views[viewName]
      if(view.global) this.globalViews[viewName] = view
    }

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

  async trigger(data) {
    if(this.shortTriggers) {
      const triggers = this.triggerRoutes[data.route]
      return await Promise.all(triggers.map(t => t.execute(data)))
    }
    const profileOp = await this.profileLog.begin({
      operation: "callTrigger", triggerType: data.type, id: data.id, by: data.by
    })
    const routes = await this.dao.get(['database', 'tableRange', this.databaseName, 'triggerRoutes',
      { gte: data.type+'=', lte: data.type+'=\xFF\xFF\xFF\xFF' }])
    console.log("TRIGGER ROUTES", data.type, '=>', routes)
    let promises = []
    for(const route of routes) {
      promises.push(this.triggerService(route.service, { ...data }, true))
    }
    const promise = Promise.all(promises)
    await this.profileLog.endPromise(profileOp, promise)
    const result = (await promise).flat()
    console.log("TRIGGER FINISHED!", result)
    return result
  }

  async triggerService(service, data, returnArray = false) {
    if(this.shortTriggers) {
      const service = this.startedServices[service]
      const triggers = service.triggers[data.type]
      if(!triggers) return []
      const result = await Promise.all(triggers.map(t => t.execute(data)))
      if(!returnArray && Array.isArray(result) && result.length == 1) return result[0]
      return result
    }
    if(!data.id) data.id = this.generateUid()
    data.service = service
    data.state = 'new'
    if(!data.timestamp) data.timestamp = (new Date()).toISOString()

    const profileOp = await this.profileLog.begin({
      operation: "callTriggerService", triggerType: data.type, service, triggerId: data.id, by: data.by
    })

    const triggersTable = this.splitCommands ? `${this.name}_triggers` : 'triggers'
    const objectObservable = this.dao.observable(
        ['database', 'tableObject', this.databaseName, triggersTable, data.id],
        ReactiveDao.ObservableValue
    )
    await this.dao.request(['database', 'update', this.databaseName, triggersTable, data.id, [
      { op: 'reverseMerge', value: data }
    ]])
    let observer
    const promise = new Promise((resolve, reject) => {
      observer = (signal, value) => {
        if(signal != 'set') return reject('unknownSignal')
        if(!value) return
        if(value.state == 'done') return resolve(value.result)
        if(value.state == 'failed') return reject(value.error)
      }
      objectObservable.observe(observer)
    }).finally(() => {
      objectObservable.unobserve(observer)
    })
    await this.profileLog.endPromise(profileOp, promise)

    const result = await promise
    if(!returnArray && Array.isArray(result) && result.length == 1) return result[0]
    return result
  }

  async command(data, requestTimeout) {
    if(!data.id) data.id = this.generateUid()
    if(!data.service) throw new Error("command must have service")
    if(!data.type) throw new Error("command must have type")
    if(!data.timestamp) data.timestamp = (new Date()).toISOString()
    data.state = 'new'

    if(this.shortCommands) {
      const command = data
      const service = this.startedServices[data.service]
      const action = service.actions[data.type]
      const reportFinished = action.definition.waitForEvents ? 'command_' + command.id : undefined
      const flags = {commandId: command.id, reportFinished}
      const emit = (!this.splitEvents || this.shortEvents)
        ? new SingleEmitQueue(service, flags)
        : new SplitEmitQueue(service, flags)
      const queuedBy = action.definition.queuedBy
      if(queuedBy) {
        const profileOp = await service.profileLog.begin({
          operation: 'queueCommand', commandType: actionName,
          commandId: command.id, client: command.client
        })
        const keyFunction = typeof queuedBy == 'function' ? queuedBy : (
          Array.isArray(queuedBy) ? (c) => JSON.stringify(queuedBy.map(k => c[k])) :
            (c) => JSON.stringify(c[queuedBy]))

        const routine = () => service.profileLog.profile({
          operation: 'runCommand', commandType: actionName,
          commandId: command.id, client: command.client
        }, async () => {
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
      await this.dao.request(['database', 'update', this.databaseName, commandsTable, data.id, [
        {op: 'reverseMerge', value: data}
      ]])
      let observer
      const promise = new Promise((resolve, reject) => {
        observer = (signal, value) => {
          if (signal != 'set') return reject('unknownSignal')
          if (!value) return
          if (value.state == 'done') return resolve(value.result)
          if (value.state == 'failed') return reject(value.error)
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
  }

  async emitEvents(service, events, flags = {}) {
    for(let event of events) {
      if(!event.service) event.service = service
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
    if(events.length == 0) {
      console.log("no events, no need to wait", reportId)
      return
    }
    const [action, id] = reportId.split('_')
    const triggerId = action == 'trigger' ? id : undefined
    const commandId = action == 'command' ? id : undefined
    const profileOp = await this.profileLog.begin({
      operation: "waitForEvents", action: action, commandId, triggerId, reportId, events, timeout
    })
    const promise = new Promise((resolve, reject) => {
      let done = false
      let finishedEvents = []
      const handleError = (message) => {
        console.error(`waitForEvents error: `, message)
        const eventsNotDone = events.filter(event => finished.find(e => e.id == event.id))
        if(eventsNotDone.length > 0) {
          console.error("  pending events:")
          for(const event of eventsNotDone) {
            console.error(`    ${event.id} - type: ${event.type}`)
          }
        }
        reject(message)
        done = true
      }
      const observable = this.dao.observable(
          ['database', 'tableObject', this.databaseName, 'eventReports', reportId]
      )
      const reportsObserver = (signal, data) => {
        if(signal != 'set') {
          handleError(`unknown signal ${signal} with data: ${data}`)
        }
        if(data == null) return /// wait for real data
        if(data.finished) {
          finishedEvents = data.finished
          if(finishedEvents.length >= events.length) {
            const eventsNotDone = events.filter(event => data.finished.find(e => e.id == event.id))
            if(eventsNotDone.length != 0) {
              const eventsDone = events.filter(event => !data.finished.find(e => e.id == event.id))
              console.error("waitForEvents - finished events does not match!")
              console.error("  finished events:")
              for(const event of eventsDone) {
                console.error(`    ${event.id} - type: ${event.type}`)
              }
              console.error("  pending events:")
              for(const event of eventsNotDone) {
                console.error(`    ${event.id} - type: ${event.type}`)
              }
            } else {
              console.log("waiting for events finished", reportId)
              resolve('finished')
              observable.unobserve(reportsObserver)
            }
          }
        }
      }
      console.log("waiting for events", reportId)
      observable.observe(reportsObserver)
      if(Number.isFinite(timeout)) {
        setTimeout(() => {
          if(done) return
          observable.unobserve(reportsObserver)
          handleError('timeout')
        }, timeout)
      }
    })
    await this.profileLog.endPromise(profileOp, promise)
    return promise
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
    const view = service.views[viewName]
    if(!view) throw new Error(`View ${viewName} not found in service ${serviceName}`)
    const result = view.observable(params)
    return result.then ? new LcDao.ObservablePromiseProxy(result) : result
  }

  async serviceViewGet(serviceName, viewName, params) {
    const service = this.startedServices[serviceName]
    const view = service.views[viewName]
    if(!view) throw new Error(`View ${viewName} not found in service ${serviceName}`)
    return await view.get(params)
  }

  viewObservable(viewName, params) {
    const view = this.globalViews[viewName]
    if(!view) throw new Error(`Global view ${viewName} not found`)
    const result = view.observable(params)
    return result.then ? new LcDao.ObservablePromiseProxy(result) : result
  }

  async viewGet(viewName, params) {
    const view = this.globalViews[viewName]
    if(!view) throw new Error(`Global view ${viewName} not found`)
    return await view.get(params)
  }

}

export default App
