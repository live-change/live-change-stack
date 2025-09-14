import WebSocket from 'universal-websocket-client'
import { ReactiveConnection } from '@live-change/dao'
import Debug from 'debug'
const debug = Debug('reactive-dao-ws')

class WebSocketConnection extends ReactiveConnection {
  constructor(credentials, url, settings) {
    super(credentials, settings)
    this.url = url
    this.initialize()
  }

  initialize() {
    debug("TRYING CONNECT BUT OFFLINE DUMMY")    
  }

  send(message) {
    const data = JSON.stringify(message)
    debug("OUTGOING MESSAGE", data, "IGNORED")    
  }

  reconnect() {
    debug("reconnect", this.url, "IGNORED")
  }

  dispose() {
    debug("close", this.url, "IGNORED")

  }

  closeConnection() {
    debug("closeConnection", this.url, "IGNORED")
  }

}

export default WebSocketConnection
