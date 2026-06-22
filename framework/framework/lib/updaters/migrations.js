import Debug from 'debug'
const debug = Debug('framework:updaters:migrations')

async function update(changes, service, app, force) {
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]
    if (change.operation !== 'runMigration') continue

    const migration = change.migration
    const name = change.name
    debug('RUN MIGRATION', service.name, name)

    await migration.run({
      dao: app.dao,
      database: app.databaseName,
      serviceName: service.name,
      app
    })
  }
}

export default update
