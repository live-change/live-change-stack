import Dao from "./Dao.js"
import ReactiveServer from "./ReactiveServer.js"
import LoopbackConnection from "./LoopbackConnection.js"
import ObservableList from "./ObservableList.js"

async function createLoopbackDao(credentials, daoFactory) {
  const server = new ReactiveServer(daoFactory)
  const loopback = new LoopbackConnection(credentials, server, {})

  const dao = new Dao(credentials, {
    remoteUrl: 'dao',
    protocols: { local: null },
    defaultRoute: {
      type: "remote",
      generator: ObservableList
    },
    connectionSettings: {
      disconnectDebug: true,
      logLevel: 10,
    },
  })

  dao.connections.set('local:dao', loopback)

  await loopback.initialize()

  if(!loopback.connected) {
    console.error("LOOPBACK NOT CONNECTED?!")
    process.exit(1)
  }

  return dao
}

export default createLoopbackDao
