import path from 'path'
import DbServer from '@live-change/db-server'
import App from "@live-change/framework"
import Dao from '@live-change/dao'

async function setupDbServer(settings) {
  const { dbRoot, dbBackend, dbBackendUrl, dbSlowStart } = settings
  console.info(`starting database in ${dbBackend === 'mem' ? 'memory' : path.resolve(dbRoot)}`)
  let server = new DbServer({
    dbRoot,
    backend: dbBackend,
    backendUrl: dbBackendUrl,
    slowStart: dbSlowStart,
    temporary: dbBackend === "mem"
  })

  process.on('unhandledRejection', (reason, promise) => {
    if(reason.stack && reason.stack.match(/\s(userCode:([a-z0-9_.\/-]+):([0-9]+):([0-9]+))\n/i)) {
      server.handleUnhandledRejectionInQuery(reason, promise)
    } 
  })

  await server.initialize()
  console.info(`database initialized!`)

  const app = App.app()

  const localServer = new Dao.ReactiveServer(() => server.createDao('local'))
  const loopback = new Dao.LoopbackConnection('local', localServer, {})
  const localConfig = {
    type: 'remote',
    generator: Dao.ObservableList,
    protocol: 'local',
    url: 'dao'
  }

  app.dao.definition = {
    ...app.dao.definition,
    protocols: { ...app.dao.definition.protocols, local: null },
    database: localConfig,
    serverDatabase: localConfig,
    store: localConfig,
  }

  app.dao.connections.set('local:dao', loopback)
  await loopback.initialize()
  if(!loopback.connected) {
    console.error("LOOPBACK NOT CONNECTED?!")
    process.exit(1)
  }

  return server
}

export default setupDbServer
