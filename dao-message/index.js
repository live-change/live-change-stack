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
    this.target.addEventListener('message', (event) => {
      debug("MSG IN:", event.data)
      this.handleMessage(JSON.parse(event.data))
    })
    this.target.addEventListener('error', (event) => {
      console.error("Worker", this.url, "error", event)
    })
    this.target.addEventListener('messageerror', (event) => {
      console.error("Worker", this.url, "message error", event)
    })
    this.target.addEventListener('unhandledrejection', (event) => {
      console.error("Worker", this.url, "unhandled rejection", event)
    })
    this.handleConnect()
    console.log("MESSAGE CONNECTED", this.url)
  }

  send(message) {
    debug("MSG OUT:", message)
    this.target.postMessage(JSON.stringify(message))
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
