import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

export async function getLastEventId() {
  if(app.splitEvents) {
    throw new Error("getLastEventId not supported in split events mode")
  } else {
    const lastLogs = await app.dao.get(['database', 'logRange', app.databaseName, 'events', { reverse: true, limit: 1 }])
    const lastLog = lastLogs[0]
    return lastLog?.id || ''
  }
}

export async function removeOldEvents(before) {
  if(app.splitEvents) {
    throw new Error("removeOldEvents not supported in split events mode")
  } else {
    await app.dao.request(['database', 'clearLog'], app.databaseName, 'events', before)
  }
}

export async function removeOldOpLogs(age = 60*60*1000) {
  const clearLimit = 40
  let cleared = 0
  do {
    const clearResults = await app.dao.requestWithSettings({ requestTimeout: 100*1e3 },
      ['database', 'clearDatabaseOpLogs'], app.databaseName, Date.now() - age, clearLimit)
    cleared = 0
    for(const result of clearResults.results) if(result.count > cleared) cleared = result.count
    //console.log("REMOVED", clearResults.count, "OP LOGS", cleared, "MAX")
    await new Promise(resolve => setTimeout(resolve, 50)) // reduceDatabaseStress
  } while(cleared === clearLimit)
}

export async function getLastTriggerTimestamp() {
  if(app.splitTriggers) {
    throw new Error("getLastTrigger not supported in split triggers mode")
  }
  const lastTriggers = await app.dao.get(
    ['database', 'indexRange', app.databaseName, 'triggers_byTimestamp', { reverse: true, limit: 1 }])
  const lastTrigger = lastTriggers[0]?.id
  return lastTrigger ? lastTrigger.split('_')[0] : null
}

export async function getLastCommandTimestamp() {
  if(app.splitCommands) {
    throw new Error("getLastCommand not supported in split commands mode")
  }
  const lastCommands = await app.dao.get(
    ['database', 'indexRange', app.databaseName, 'commands_byTimestamp', { reverse: true, limit: 1 }])
  const lastCommand = lastCommands[0]?.id
  return lastCommand ? lastCommand.split('_')[0] : null
}

const clearQuery = `${async (input, output, { tableName, bucket, before }) => {
  const indexReader = await input.index(tableName + '_byTimestamp')
  const tableWriter = await output.table(tableName)
  const range = { limit: bucket, lt: before }
  const pointers = await indexReader.rangeGet(range)
  for(const pointer of pointers) {
    await tableWriter.delete(pointer.to)
  }
  await output.put({ count: pointers.length })
}}`

export async function removeOldTriggers(before, options) {
  const bucket = options?.bucket || 128
  if(app.splitTriggers) {
    throw new Error("removeOldTriggers not supported in split triggers mode")
  }
  let more = true
  while(more) {
    const queryResult = await app.dao.request(['database', 'query'], app.databaseName, clearQuery,
      { tableName: 'triggers', bucket, before })
    const deleteStats = queryResult[0]
    if(options.delay) await new Promise(resolve => setTimeout(resolve, options.delay))
    more = deleteStats.count >= bucket
  }
}

export async function removeOldCommands(before, options) {
  const bucket = options?.bucket || 128
  if(app.splitCommands) {
    throw new Error("removeOldCommands not supported in split commands mode")
  }
  let more = true
  while(more) {
    const queryResult = await app.dao.request(['database', 'query'], app.databaseName, clearQuery,
      { tableName: 'commands', bucket, before })
    const deleteStats = queryResult[0]
    if(options.delay) await new Promise(resolve => setTimeout(resolve, options.delay))
    more = deleteStats.count >= bucket
  }
}