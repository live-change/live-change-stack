const { client: WSClient } = require("@live-change/dao-websocket")
const ReactiveDao = require("@live-change/dao")

async function observe({ serverUrl, path, verbose }) {
  if(verbose) console.info(`observing ${serverUrl} value ${JSON.stringify(path)}`)
  let done = false
  const client = new WSClient("commandLine", serverUrl, {
    connectionSettings: {
      logLevel: 1
    },
    onConnect: () => {
      if(verbose) console.info("connected to server")
    },
    onDisconnect: () => {
      if(verbose) console.info("disconnected from server")
      if(!done) {
        console.error("disconnected before request done")
        process.exit(1)
      }
    }
  })
  const observable = client.observable(path, ReactiveDao.ObservableList)
  observable.observe((signal, ...args) => {
    done = true
    console.log(`signal: ${signal}`)
    for(const arg of args) console.log(JSON.stringify(arg, null, "  "))
  })
}

module.exports = observe
