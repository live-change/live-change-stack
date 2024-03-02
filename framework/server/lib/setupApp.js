import os from 'os'

import { hashCode, encodeNumber, uidGenerator }from '@live-change/uid'

import setupDbServer from './setupDbServer.js'
import setupDbClient from './setupDbClient.js'
import createLoopbackDao from './createLoopbackDao.js'

import Debug from 'debug'
const debug = Debug('server:app')

import App from "@live-change/framework"

async function setupApp(settings, env = process.env) {
  const app = App.app()
  app.instanceId = encodeNumber(hashCode(
    `app${process.pid}${os.hostname()} ${process.cwd()}/${process.argv.join(' ')}`))
  app.uidGenerator = uidGenerator(app.instanceId, 1, settings.uidBorders)
  debug("SETUP APP", settings)
  let dbServer
  if(settings.withDb) {
    dbServer = await setupDbServer(settings)
    const loopbackDao = await createLoopbackDao('local', () => dbServer.createDao('local'))
    app.dao = loopbackDao
  } else {
    app.dao = setupDbClient(settings)
  }
  app.databaseName = env.DB_NAME || 'test'
}

export default setupApp
