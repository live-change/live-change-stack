const { client: WSClient } = require("@live-change/dao-websocket")

async function get({ serverUrl, path, verbose }) {
  if(verbose) console.info(`getting ${serverUrl} value ${JSON.stringify(path)}`)
  let done = false
  let promise
  const client = new WSClient("commandLine", serverUrl, {
    connectionSettings: {
      logLevel: 1
    },
    onConnect: () => {
      if(verbose) console.info("connected to server")
      if(promise) return;
      promise = client.get(path)
      promise.then(result => {
        if(verbose) console.log("get result:")
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

module.exports = get