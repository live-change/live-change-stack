import { client as WSClient } from "@live-change/dao-websocket"
import lineReader from 'line-reader'

async function exec(options) {
  let { serverUrl, verbose, file, targetDb } = options

  let done = false

  let sourceDb

  const clientPromise = new Promise((resolve, reject) => {
    const client = new WSClient("commandLine", serverUrl, {
      connectionSettings: {
        logLevel: 1
      },
      onConnect: () => {
        if(verbose) console.error("connected to server")
        resolve(client)
      },
      onDisconnect: () => {
        if(verbose) console.error("disconnected from server")
        if(!done) {
          console.error("disconnected before request done")
          process.exit(1)
        } else {
          process.exit(0)
        }
      }
    })
  })

  lineReader.open(file == '-' ? process.stdin : file, async function(err, reader) {
    if (err) throw err

    const client = await clientPromise
    let currentPromises = []
    const maxPromises = 256

    function nextLine() {
      return new Promise(function(resolve, reject) {
        reader.nextLine(function(err, line) {
          if (err) return reject(err)
          resolve(line)
        })
      })
    }
    while (reader.hasNextLine()) {
      const line = await nextLine()
      const command = JSON.parse(line)
      switch(command.type) {
        case 'request' :
          while(currentPromises.length > maxPromises) {
            await currentPromises[0]
            currentPromises.shift()
          }
          if(!sourceDb) {
            sourceDb = command.parameters[0]
          }
          if(targetDb) {
            if(sourceDb != command.parameters[0])
              throw new Error(`source database changed from ${sourceDb} to ${command.parameters[0]}`)
            command.parameters[0] = targetDb
          }
          //console.log("REQUEST", command.method, command.parameters)
          currentPromises.push(client.request(command.method, ...command.parameters))
          break;
        case 'sync' :
          await Promise.all(currentPromises)
          currentPromises = []
          break;
      }
    }
    reader.close(function(err) {
      if (err) throw err
    })

    await Promise.all(currentPromises)

    done = true

    client.dispose()

  })
}

export default exec