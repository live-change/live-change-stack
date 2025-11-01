import SockJS from "sockjs-client"
import { ReactiveConnection } from "@live-change/dao"
import Debug from "debug"
const debug = Debug('dao:sockjs')

class SockJsConnection extends ReactiveConnection {
  constructor(credentials, url, settings) {
    super(credentials, settings)
    this.url = url
    this.initialize()
  }

  connectionInfo() {
    return {
      type: 'sockjs',
      url: this.url,
      settings: this.settings,
      credentials: this.credentials,
    }
  }

  initialize() {
    this.connection = new SockJS(this.url)
    const connection = this.connection
    console.log("INITIALIZE SOCKJS!", this.url)
    connection.onopen = (function () {
      if (connection.readyState === SockJS.CONNECTING) return setTimeout(connection.onopen, 230)
      this.handleConnect()
    }).bind(this)
    connection.onclose = (function () {
      const ef = function () {
      }
      connection.onclose = ef
      connection.onmessage = ef
      connection.onheartbeat = ef
      connection.onopen = ef
      this.handleDisconnect()
    }).bind(this)
    this.connection.onmessage = (function (e) {
      debug("MSG IN:", e.data)
      const message = JSON.parse(e.data)
      this.handleMessage(message)
    }).bind(this)
    /*this.connection.onheartbeat = (function(){
     console.log('BULLET PING!')
     this.send({type:"ping"})
     }).bind(this)*/
  }

  send(message) {
    const data = JSON.stringify(message)
    debug("MSG OUT:", data)
    this.connection.send(data)
  }

  reconnect() {
    this.connection.close()
    if (this.autoReconnect) return;
    this.initialize()
  }

  dispose() {
    super.dispose()
    this.connection.close()
  }

  closeConnection() {
    this.connection.close()
  }

}

export default SockJsConnection
