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
    debug("connecting", this.url, "...")
    this.connection = new WebSocket(this.url, "reactive-observer", this.settings)
    let connection = this.connection
    connection.onopen = (function () {
      debug("connection", this.url, "open")
      if (connection.readyState === WebSocket.CONNECTING) return setTimeout(connection.onopen, 230)
      this.handleConnect()
    }).bind(this)
    const disconnect = () => {
      let ef = function () {
      }
      connection.onclose = ef
      connection.onmessage = ef
      connection.onheartbeat = ef
      connection.onopen = ef
      connection.onerror = ef
      this.handleDisconnect()
    }
    connection.onclose = (function () {
      debug("connection", this.url, " close")
      disconnect()
    }).bind(this)
    connection.onmessage = (function (e) {
      debug("INCOMING MESSAGE", e.data)
      const message = JSON.parse(e.data)
      this.handleMessage(message)
    }).bind(this)
    connection.onerror = (function(err) {
      debug("connection", this.url, "error", err.message)
      disconnect()
    })
  }

  send(message) {
    const data = JSON.stringify(message)
    debug("OUTGOING MESSAGE", data)
    this.connection.send(data)
  }

  reconnect() {
    debug("reconnect", this.url)
    this.connection.close()
    if (this.autoReconnect) return;
    this.initialize()
  }

  dispose() {
    debug("close", this.url)
    super.dispose()
    this.connection.close()
  }

  closeConnection() {
    this.connection.close()
  }

}

export default WebSocketConnection
