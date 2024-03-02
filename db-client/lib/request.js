import { client as WSClient } from "@live-change/dao-websocket"

async function request({ serverUrl, method, args, verbose }) {
  if(verbose) console.info(`requesting ${serverUrl} method ${JSON.stringify(method)} with arguments `
      +`${args.map(a=>JSON.stringify(a)).join(', ')}`)
  let done = false
  let promise
  const client = new WSClient("commandLine", serverUrl, {
    connectionSettings: {
      logLevel: 1
    },
    onConnect: () => {
      if(verbose) console.info("connected to server")
      if(promise) return;
      promise = client.request(method, ...args)
      promise.then(result => {
        if(verbose) console.log("command result:")
        console.log(JSON.stringify(result, null, "  "))
        done = true
        client.dispose()
      }).catch(error => {
        console.error(error)
        done = true
        client.dispose()
      })
    },
    onDisconnect: () => {
      if(verbose) console.info("disconnected from server")
      if(!done) {
        console.error("disconnected before request done")
        process.exit(1)
      } else {
        process.exit(0)
      }
    }
  })
}

export default request
