import { ReactiveConnection } from "@live-change/dao"
import Debug from "debug"
const debug = Debug('dao-message')

class MessageConnection extends ReactiveConnection {

  constructor(credentials, url, settings) {
    super(credentials, settings)
    this.url = url
    this.target = settings.target
    this.messageChannel = settings.messageChannel ? new MessageChannel() : null
    this.port = settings.messagePort ?? (this.messageChannel ? this.messageChannel.port1 : this.target)
    this.decorator = settings.decorator || ((message) => message)
    this.filter = settings.filter || ((message) => true)
    this.initialize()
  }

  initialize() {
    this.port.addEventListener('message', (event) => {
      debug("MSG IN:", event.data)
      const data = JSON.parse(event.data)
      if(!this.filter(data)) return
      this.handleMessage(data)
    })
    this.port.addEventListener('messageerror', (event) => {
      console.error("Worker", this.url, "message error", event)
    })
    if(this.target?.addEventListener) {
      this.target.addEventListener('error', (event) => {
        console.error("Worker", this.url, "error", event)
      })
      this.target.addEventListener('unhandledrejection', (event) => {
        console.error("Worker", this.url, "unhandled rejection", event)
      })
    }
    if(this.port.start) {
      this.port.start()
    }
    if(this.messageChannel) {
      this.target.postMessage({ type: 'connection', port: this.messageChannel.port2 }, [this.messageChannel.port2])
    }
    this.handleConnect()
    debug("MESSAGE CONNECTED", this.url)
  }

  send(message) {
    message = this.decorator(message)
    debug("MSG OUT:", message)
    this.port.postMessage(JSON.stringify(message))
  }

  reconnect() {
    // impossible to reconnect web worker or other message channel
  }

  dispose() {
    if(this.messageChannel) {
      this.port.postMessage(JSON.stringify({ type: 'close' }))
      this.port.close()
    } else {
      if (this.target?.terminate) this.target.terminate()
    }
  }

  closeConnection() {
    // impossible to disconnect running web worker
  }

}

export default MessageConnection
