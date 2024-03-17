import ReactiveDao from "@live-change/dao"
import * as ReactiveDaoWebsocket from "@live-change/dao-websocket"
import setupDbServer from "./setupDbServer.js"
import createLoopbackDao from "./createLoopbackDao.js"
import App from "@live-change/framework"

function setupDbClient(argv, env = process.env) {
  const config = {
    url: env.DB_URL,
    name: env.DB_NAME,
    requestTimeout: env.DB_REQUEST_TIMEOUT && +env.DB_REQUEST_TIMEOUT,
    //unobserveDebug: env.UNOBSERVE_DEBUG == "YES",
  }
  const app = App.app()

  const remoteConfig = {
    type: 'remote',
    protocol: 'dbWs',
    url: config?.url || "http://localhost:9417/api/ws",
    generator: ReactiveDao.ObservableList,
  }

  app.dao.definition = {
    ...app.dao.definition,
    protocols: { ...app.dao.definition.protocols, dbWs: ReactiveDaoWebsocket.client },
    connectionSettings: app.dao.definition.connectionSettings ?? {
      queueRequestsWhenDisconnected: true,
      requestSendTimeout: 2000,
      requestTimeout: config.requestTimeout,
      queueActiveRequestsOnDisconnect: false,
      autoReconnectDelay: 200,
      logLevel: 1,
      unobserveDebug: config?.unobserveDebug || false
    },
    database: remoteConfig,
    store: remoteConfig,
  }
}

export default setupDbClient
