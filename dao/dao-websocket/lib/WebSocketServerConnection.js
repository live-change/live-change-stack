import EventEmitter from 'events'
import Debug from 'debug'
const debug = Debug('dao:websocket:server')

class WebSocketServerConnection extends EventEmitter {
  constructor(request, origin) {
    super()
    this.headers = request.httpRequest.headers
    this.remoteAddress = request.httpRequest.connection.remoteAddress
    this.connection = request.accept(request.requestedProtocols[0] || null, origin || request.origin)
    this.connection.on('message', (message)=>{    
      if (message.type === 'utf8') {
        debug("DAO WS SERVER MSG IN:", message.utf8Data)
        this.emit('data', message.utf8Data)
      }
      else if (message.type === 'binary') {
        debug("DAO WS SERVER MSG IN (binary):", message.binaryData)
        this.emit('binary', message.binaryData)
      }
    })
    this.connection.on('close', (reasonCode, description) => {
      debug("DAO WS SERVER CLOSE BY CLIENT", reasonCode, description)
      this.emit('close', reasonCode, description)
    })
  }
  write(data) {
    this.connection.sendUTF(data)
  }
  close() {
    debug("DAO WS SERVER CLOSE BY SERVER")  
    this.connection.close()
  }
}

export default WebSocketServerConnection
