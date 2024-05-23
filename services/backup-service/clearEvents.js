import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

export async function getLastEventId() {
  if(app.splitEvents) {
    throw new Error("getLastEventId not supported in split events mode")
  } else {
    const lastLogs = app.dao.get(['database', 'logRange', app.databaseName, 'events', { reverse: true, limit: 1 }])
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
