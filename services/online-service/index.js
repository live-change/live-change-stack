import http from 'http'
import ReactiveDao, { ReactiveServer } from "@live-change/dao"
import * as ReactiveDaoWebsocket from "@live-change/dao-websocket"
import { server as WebSocketServer } from 'websocket'

import App from '@live-change/framework'
const app = App.app()

const logger = App.utils.loggingHelpers('online', '0.1.0')

function onlineLog(event, extra) {
  if (extra === undefined) console.log(`[online] ${event}`)
  else console.log(`[online] ${event}`, extra)
}

function logTrigger(triggerName, params) {
  logger.log("TRIGGER", triggerName, params)
  onlineLog('TRIGGER', { triggerName, params })
}

const definition = app.createServiceDefinition({
  name: 'online'
})

const config = definition.config
const onlinePort = config.port || process.env.ONLINE_PORT || 8006
const onlineHost = config.host || process.env.ONLINE_HOST || 'localhost'
const onlineUrl = `ws://${onlineHost}:${onlinePort}/ws`

const eventDelay = 2000
const cacheDelay = 5000

async function sendOnlineEvent(path) {
  const type = path[0]
  const params = path[1]
  try {
    if(type === 'object') {
      const { group } = params
      logger.log("PARAMs", params)
      const triggerName = `${group}Online`
      logTrigger(triggerName, params)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    } else if(type === 'user') {
      const { group, user } = params
      const triggerName = `user${group ? group.slice(0, 1).toUpperCase() + group.slice(1) : ''}Online`
      logTrigger(triggerName, params)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    } else if(type === 'session') {
      const { group, session } = params
      const triggerName = `session${group ? group.slice(0, 1).toUpperCase() + group.slice(1) : ''}Online`
      logTrigger(triggerName, params)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    }
  } catch(error) {
    logger.error("ONLINE EVENT ERROR", error)
    console.error('[online] ONLINE EVENT ERROR', error)
  }
}

async function sendOfflineEvent(path) {
  const type = path[0]
  const params = path[1]
  try {
    if(type === 'object') {
      const { group } = params
      const triggerName = `${group}Offline`
      logTrigger(triggerName, params)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    } else if(type === 'user') {
      const { group, user } = params
      const triggerName = `user${group ? group.slice(0, 1).toUpperCase() + group.slice(1) : ''}Offline`
      logTrigger(triggerName, params)
      await app.trigger({ type: triggerName }, {
        ...params,
      })
    } else if(type === 'session') {
      const { group, session } = params
      const triggerName = `session${group ? group.slice(0, 1).toUpperCase() + group.slice(1) : ''}Offline`
      logTrigger(triggerName, params)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    }
  } catch(error) {
    logger.error("OFFLINE EVENT ERROR", error)
    console.error('[online] OFFLINE EVENT ERROR', error)
  }
}

async function sendAllOfflineEvent() {
  logger.log("SEND ALL OFFLINE EVENT")
  onlineLog('SEND ALL OFFLINE EVENT')
  await app.trigger({ type: `allOffline` }, { })
}

const selfObservables = new Map()

class SelfObservable extends ReactiveDao.Observable {
  constructor(path) {
    super()
    this.path = path
    this.disposeTimeout = null
    this.onlineEventTimeout = null
    this.offlineEventTimeout = null
    this.lastEvent = null

    logger.log("PATH", JSON.stringify(this.path), "IS ONLINE")
    onlineLog('PATH IS ONLINE', this.path)
    this.setOnlineEventTimeout()
  }
  setOnlineEventTimeout() {
    if(this.lastEvent === 'online') return
    this.onlineEventTimeout = setTimeout(() => {
      sendOnlineEvent(this.path)
      this.lastEvent = 'online'
      this.onlineEventTimeout = null
    }, eventDelay)
  }
  setOfflineEventTimeout() {
    if(this.lastEvent === 'offline') return
    this.offlineEventTimeout = setTimeout(() => {
      sendOfflineEvent(this.path)
      this.lastEvent = 'offline'
      this.offlineEventTimeout = null
    }, eventDelay)
  }
  clearOnlineEventTimeout() {
    if(this.onlineEventTimeout) {
      clearTimeout(this.onlineEventTimeout)
      this.onlineEventTimeout = null
    }
  }
  clearOfflineEventTimeout() {
    if(this.offlineEventTimeout) {
      clearTimeout(this.offlineEventTimeout)
      this.offlineEventTimeout = null
    }
  }
  observe(observer) {
    if(this.isDisposed()) this.respawn()
    this.observers.push(observer)
    this.fireObserver(observer, 'set', this.observers.length)
  }
  unobserve(observer) {
    logger.log("ONLINE UNOBSERVED", JSON.stringify(this.path), "observersLeft", Math.max(0, this.observers.length - 1))
    onlineLog('UNOBSERVED', { path: this.path, observersLeft: Math.max(0, this.observers.length - 1) })
    this.observers.splice(this.observers.indexOf(observer), 1)
    this.fireObservers('set', this.observers.length)
    if(this.isUseless()) this.dispose()
  }
  dispose() {
    this.disposed = true
    logger.log("PATH", JSON.stringify(this.path), "IS OFFLINE")
    onlineLog('PATH IS OFFLINE', this.path)
    this.disposeTimeout = setTimeout(() => {
      if(this.disposed) {
        selfObservables.delete(JSON.stringify(this.path))
      }
    }, cacheDelay)
    this.clearOnlineEventTimeout()
    this.setOfflineEventTimeout()
  }
  respawn() {
    if(this.disposeTimeout) {
      clearTimeout(this.disposeTimeout)
      this.disposeTimeout = null
    }
    this.disposed = false
    this.clearOfflineEventTimeout()
    this.setOnlineEventTimeout()
    logger.log("PATH", JSON.stringify(this.path), "IS ONLINE AGAIN")
    onlineLog('PATH IS ONLINE AGAIN', this.path)
  }
}

function getSelfObservable(path) {
  let observable = selfObservables.get(JSON.stringify(path))
  if(observable) return observable
  observable = new SelfObservable(path)
  selfObservables.set(JSON.stringify(path), observable)
  return observable
}

const onlineDao = {
  observable([type, ...path]) {
    logger.log("OBSERVABLE", type, path)
    if(type !== 'online') throw new Error("not found")
    return getSelfObservable(path)
  },
  get([type, ...path]) {
    logger.log("GET", type, path)
    if(type !== 'online') throw new Error("not found")
    let observable = selfObservables.get(path)
    return observable ? observable.observers.length : 0
  },
  dispose() {
  }
}

const createDao = (clientSessionId) => {
  logger.log("ONLINE SERVICE DAO")
  return onlineDao
}

definition.afterStart(async service => {
  await sendAllOfflineEvent()

  const reactiveServer = new ReactiveServer(createDao)

  const httpServer = http.createServer() // TODO: pure HTTP API
  httpServer.listen(onlinePort)

  let wsServer = new WebSocketServer({
    httpServer,
    autoAcceptConnections: false,
    // Default websocket keepaliveGracePeriod is 10s. This hop is in-process with
    // the API server; a stall can miss the pong and drop presence. Widen grace only here.
    keepaliveGracePeriod: 40000
  })
  wsServer.on("request",(request) => {
    const remote = request.remoteAddress
      || request.httpRequest?.socket?.remoteAddress
      || request.httpRequest?.connection?.remoteAddress
      || null
    logger.log("ONLINE WS ACCEPT", { remote })
    onlineLog('WS ACCEPT', { remote })
    let serverConnection = new ReactiveDaoWebsocket.server(request)
    serverConnection.on('close', (reasonCode, description) => {
      logger.log("ONLINE WS CLOSE", { remote, reasonCode, description })
      onlineLog('WS CLOSE', { remote, reasonCode, description })
    })
    reactiveServer.handleConnection(serverConnection)
  })

  logger.log(`online server started at localhost:${onlinePort}`)
})

const onlineClient = new ReactiveDaoWebsocket.client("api-server-"+process.pid, onlineUrl)
onlineClient.on('connect', () => {
  logger.log("ONLINE CLIENT CONNECT", { url: onlineUrl, pid: process.pid })
})
onlineClient.on('disconnect', (info) => {
  logger.log("ONLINE CLIENT DISCONNECT", { url: onlineUrl, pid: process.pid, info: info ?? null })
})
onlineClient.on('reconnect', () => {
  logger.log("ONLINE CLIENT RECONNECT", { url: onlineUrl, pid: process.pid })
})

definition.view({
  name: "session",
  properties: {},
  async get(params, { client, service }) {
    const { session } = client
    return onlineClient.get(['online', 'session', client.session, { ...params, session }])
  },
  async observable(params, { client, service }) {
    const { session } = client
    return onlineClient.observable(['online', 'session', { ...params, session }], ReactiveDao.ObservableValue)
  }
})

definition.view({
  name: "user",
  properties: {},
  async get(params, { client, service }) {
    const { user } = client
    return onlineClient.get(['online', 'user', { ...params, user }])
  },
  async observable(params, { client, service }) {
    const { user } = client
    return onlineClient.observable(['online', 'user', { ...params, user }], ReactiveDao.ObservableValue)
  }
})

definition.view({
  name: "self",
  properties: {},
  async get(params, { client, service }) {
    return onlineClient.get(client.user
        ? ['online', 'user', { ...params, user: client.user }]
        : ['online', 'session', { ...params, session: client.session }])
  },
  async observable(params, { client, service }) {
    return onlineClient.observable(client.user
        ? ['online', 'user', { ...params, user: client.user }]
        : ['online', 'session', { ...params, session: client.session }], ReactiveDao.ObservableValue)
  }
})

definition.view({
  name: "object",
  properties: {
    objectType: {
      type: String
    },
    objectId: {
      type: String
    }
  },
  async get({ objectType, objectId }, { client, service }) {
    return onlineClient.get(['online', 'object', { objectType, objectId }])
  },
  async observable({ objectType, objectId }, { client, service }) {
    return onlineClient.observable(['online', 'object', { objectType, objectId }], ReactiveDao.ObservableValue)
  }
})

export default definition
