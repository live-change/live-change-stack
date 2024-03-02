import Connection from "./ReactiveConnection.js"
import Debug from "debug"
const debug = Debug("reactive-dao:loopback-connection")

class LoopbackConnection extends Connection {
  constructor(credentials, server, settings) {
    super(credentials, settings)
    this.packetFilter = settings.packetFilter
    this.server = server
    this.delay = settings.delay || 0
    this.serverMessageListener = null
    this.serverCloseListener = null
    this.headers = {}
  }

  next(fn) {
    if(this.delay) {
      setTimeout(fn, this.delay)
    } else {
      fn()
    }
  }

  initialize() {
    if(this.initPromise) return this.initPromise
    delete this.events['data']
    this.initPromise = new Promise((resolve, reject) => {
      this.next(() => {
        this.server.handleConnection(this)
        this.handleConnect()
        this.initPromise = null
        resolve(true)
      })
    })
    return this.initPromise
  }

  send(message) {
    if(!this.connected) return;
    const data = JSON.stringify(message)
    debug("CLIENT => SERVER Message", message)
    if(this.packetFilter && !this.packetFilter(message, true)) {
      debug("Message filtered")
      return;
    }
    this.next(() => {
      this.emit('data', data)
    })
  }

  reconnect() {
    debug("reconnect!")
    this.handleDisconnect()
    this.serverCloseListener()
    if (this.autoReconnect) return;
    this.initialize()
  }

  dispose() {
    super.dispose()
    this.handleDisconnect()
    this.emit('close')
  }

  closeConnection() {
    this.emit('close')
    this.handleDisconnect()
  }

  close() {
    this.emit('close')
    this.handleDisconnect()
  }

  write(json) {
    if(!this.connected) return;
    const message = JSON.parse(json)
    debug("SERVER => CLIENT Message", message)
    if(this.packetFilter && !this.packetFilter(message, false)) {
      debug("Message filtered")
      return;
    }
    this.next(() => {
        this.handleMessage(message)
    }, this.delay)
  }

}

export default LoopbackConnection