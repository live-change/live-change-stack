import { server as WebSocketServer} from 'websocket'
import * as DaoWebsocket from "@live-change/dao-websocket"

function setupApiWs(httpServer, apiServer, options = {}) {
  const {
    maxReceivedFrameSize = 1024 * 1024,
    maxReceivedMessageSize = 10 * 1024 * 1024
  } = options
  const wsServer = new WebSocketServer({
    httpServer,
    autoAcceptConnections: false,
    maxReceivedFrameSize,
    maxReceivedMessageSize
  })
  wsServer.on("request",(request) => {
    console.log("WS URI", request.httpRequest.url)
    if(request.httpRequest.url != "/api/ws") return request.reject()
    let serverConnection = new DaoWebsocket.server(request)
    apiServer.handleConnection(serverConnection)
  })
  return wsServer
}

export default setupApiWs