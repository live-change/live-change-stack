import ReactiveServerConnection from './ReactiveServerConnection.js'
import Debug from 'debug'
const debug = Debug('dao')

class ReactiveServer {
  constructor(daoFactory, settings) {
    this.settings = settings || {}
    this.daoFactory = daoFactory
    this.connections = new Map()
    this.lastConnectionId = 0
  }
  handleConnection(connection) {
    let id = ++this.lastConnectionId
    let reactiveConnection = new ReactiveServerConnection(this, id, connection, this.daoFactory, this.settings)
    this.connections.set( reactiveConnection.id, reactiveConnection )
    debug("ReactiveServer: new connection", id, 'total', this.connections.size)
  }
  handleConnectionClose(reactiveConnection) {
    this.connections.delete( reactiveConnection.id )
    debug("ReactiveServer: connection closed", reactiveConnection.id, 'total', this.connections.size)
  }
}

export default ReactiveServer
