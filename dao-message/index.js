const rd = require("@live-change/dao")
const Connection = rd.ReactiveConnection
const debug = require('debug')('dao:message')

class MessageConnection extends Connection {

  constructor(credentials, url, settings) {
    super(credentials, settings)
    this.url = url
    this.target = settings.target
    this.initialize()
  }

  initialize() {
    this.target.onmessage = event => {
      debug("MSG IN:", data)
      this.handleMessage(event.data)
    }
    this.target.onerror = event => {
      console.error("Worker", this.url, "error", event)
    }
    this.target.onmessageerror = event => {
      console.error("Worker", this.url, "message error", event)
    }
    this.target.onunhandledrejection = event => {
      console.error("Worker", this.url, "unhandled rejection", event)
    }
  }

  send(message) {
    debug("MSG OUT:", data)
    this.target.postMessage(message)
  }

  reconnect() {
    // impossible to reconnect web worker or other message channel
  }

  dispose() {
    if(this.target.terminate) this.target.terminate()
  }

  closeConnection() {
    // impossible to disconnect running web worker
  }

}

module.exports = MessageConnection
module.exports.MessageConnection = MessageConnection
