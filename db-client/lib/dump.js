const { client: WSClient } = require("@live-change/dao-websocket")

async function dump(
    options,
    req = (method, ...args) => console.log(JSON.stringify({ type: 'request', method, parameters: args })),
    sync = () => console.log(JSON.stringify({ type: 'sync' }))
) {
  let { serverUrl, verbose, db, targetDb, tables, logs, metadata, structure } = options
  if(!targetDb) targetDb = db
  // console.log("options", options)
  const dumpAll = !tables && !logs

  let done = false

  let disconnectCallbacks
  const disconnectPromise = new Promise((resolve, reject) => disconnectCallbacks = { resolve, reject })

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
          disconnectCallbacks.reject("disconnected before request done")
        } else {
          disconnectCallbacks.resolve('ok')
        }
      }
    })
  })

  const client = await clientPromise


  let tablesList = tables || [], logsList = logs || []
  let databaseConfig
  if(structure || metadata) {
    databaseConfig = await client.get(['database', 'databaseConfig', db])
  }
  if(dumpAll && (structure || metadata)) {
    // console.log("CONFIG", databaseConfig)
    tablesList = Object.keys(databaseConfig.tables)
    logsList = Object.keys(databaseConfig.logs)
  } else if(dumpAll) {
    tablesList = await client.get(['database', 'tablesList', db])
    logsList = await client.get(['database', 'logsList', db])
  }
  if(structure || metadata) {
    if(dumpAll) {
      await req(['database', 'createDatabase'], targetDb,
        { ...databaseConfig, tables: undefined, logs: undefined, indexes: undefined})
      sync()
    }
    for(let tableName of tablesList) {
      await req(['database', 'createTable'], targetDb, tableName, databaseConfig.tables[tableName])
    }
    for(let logName of logsList) {
      await req(['database', 'createLog'], targetDb, logName, databaseConfig.logs[logName])
    }
    if(dumpAll) {
      let indexesCreatedBefore = []
      let indexesCreatedNow = []
      let moreIndexes = Object.keys(databaseConfig.indexes)
      let phase = 0
      while(moreIndexes.length > 0) {
        //console.error("PHASE", ++phase, "INDEXES", moreIndexes.length)
        await sync()
        for(const indexName of moreIndexes) {
          const conf = databaseConfig.indexes[indexName]
          let wait = false
          //console.error("INDEX", indexName, "SOURCES", conf.sources)
          for(const source of conf.sources || []) {
            if(source.type == 'index') {
              //console.error("INDEX", indexName, "HAS INDEX SOURCE", source.name)
              if(!indexesCreatedBefore.includes(source.name)) {
                //console.error("WE WILL WAIT FOR THAT INDEX")
                wait = true
              }
            }
          }
          if(wait) continue
          await req(['database', 'createIndex'], targetDb, indexName, conf.code, conf.parameters,
              { ...conf, code: undefined, parameters: undefined })
          indexesCreatedNow.push(indexName)
        }
        moreIndexes = moreIndexes.filter(ind => !indexesCreatedNow.includes(ind))
        indexesCreatedBefore = indexesCreatedBefore.concat(indexesCreatedNow)
        indexesCreatedNow = []
      }
      /*      for(let indexName in databaseConfig.indexes) {
              const conf = databaseConfig.indexes[indexName]
              req(['database', 'createIndex'], targetDb, indexName, conf.code, conf.parameters,
                  { ...conf, code: undefined, parameters: undefined })
            }*/
    }
    await  sync()
  }

  async function stream(path, output) {
    const bucket = 256
    let found = 0
    let position = ''
    do {
      const results = await client.get(path(position, bucket))
      await Promise.all(results.map(output))
      found = results.length
      if(results.length) position = results[results.length - 1].id
    } while(found == bucket)
  }

  if(!metadata) {
    for(let tableName of tablesList) {
      await stream(
          (from, limit) => ['database', 'tableRange', db, tableName, { gt: from, limit }],
          row => req(['database', 'put'], targetDb, tableName, row)
      )
    }
    for(let logName of logsList) {
      await stream(
          (from, limit) => ['database', 'logRange', db, logName, { gt: from, limit }],
          row => req(['database', 'putOldLog'], targetDb, logName, row)
      )
    }
  }

  done = true

  client.dispose()

  await disconnectPromise
}

module.exports = dump