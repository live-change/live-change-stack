import http from 'http'
import ReactiveDao, { ReactiveServer } from "@live-change/dao"
import * as ReactiveDaoWebsocket from "@live-change/dao-websocket"
import { server as WebSocketServer } from 'websocket'

import App from '@live-change/framework'
const app = App.app()

const logger = App.utils.loggingHelpers('online', '0.1.0')

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
      logger.log("TRIGGER", triggerName)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    } else if(type === 'user') {
      const { group, user } = params
      const triggerName = `user${group ? group.slice(0, 1).toUpperCase() + group.slice(1) : ''}Online`
      logger.log("TRIGGER", triggerName)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    } else if(type === 'session') {
      const { group, session } = params
      const triggerName = `session${group ? group.slice(0, 1).toUpperCase() + group.slice(1) : ''}Online`
      logger.log("TRIGGER", triggerName)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    }
  } catch(error) {
    logger.error("ONLINE EVENT ERROR")
  }
}

async function sendOfflineEvent(path) {
  const type = path[0]
  const params = path[1]
  try {
    if(type === 'object') {
      const { group } = params
      const triggerName = `${group}Offline`
      logger.log("TRIGGER", triggerName)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    } else if(type === 'user') {
      const { group, user } = params
      const triggerName = `user${group ? group.slice(0, 1).toUpperCase() + group.slice(1) : ''}Offline`
      logger.log("TRIGGER", triggerName)
      await app.trigger({ type: triggerName }, {
        ...params,
      })
    } else if(type === 'session') {
      const { group, session } = params
      const triggerName = `session${group ? group.slice(0, 1).toUpperCase() + group.slice(1) : ''}Offline`
      logger.log("TRIGGER", triggerName)
      await app.trigger({ type: triggerName }, {
        ...params
      })
    }
  } catch(error) {
    logger.error("OFFLINE EVENT ERROR")
  }
}

async function sendAllOfflineEvent() {
  logger.log("SEND ALL OFFLINE EVENT")
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

    logger.log("PATH", this.path, "IS ONLINE")
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
    logger.log("ONLINE UNOBSERVED")
    this.observers.splice(this.observers.indexOf(observer), 1)
    this.fireObservers('set', this.observers.length)
    if(this.isUseless()) this.dispose()
  }
  dispose() {
    this.disposed = true
    logger.log("PATH", this.path, "IS OFFLINE")
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
    logger.log("PATH", this.path, "IS ONLINE AGAIN")
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

  let wsServer = new WebSocketServer({httpServer, autoAcceptConnections: false})
  wsServer.on("request",(request) => {
    let serverConnection = new ReactiveDaoWebsocket.server(request)
    reactiveServer.handleConnection(serverConnection)
  })

  logger.log(`online server started at localhost:${onlinePort}`)
})

const onlineClient = new ReactiveDaoWebsocket.client("api-server-"+process.pid, onlineUrl)

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
