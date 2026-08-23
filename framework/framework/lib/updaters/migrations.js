import Debug from 'debug'
const debug = Debug('framework:updaters:migrations')
import { startupLog, formatMs } from '../utils/startupLog.js'

async function migrationsUpdater(changes, service, app, force) {
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]
    if (change.operation !== 'runMigration') continue

    const migration = change.migration
    const name = change.name
    debug('RUN MIGRATION', service.name, name)
    const t0 = Date.now()
    startupLog('migrationsUpdater', service.name, 'runMigration', name, 'begin')

    await migration.run({
      dao: app.dao,
      database: app.databaseName,
      serviceName: service.name,
      app
    })
    startupLog('migrationsUpdater', service.name, 'runMigration', name, 'done', `in ${formatMs(Date.now() - t0)}`)
  }
}

export default migrationsUpdater
