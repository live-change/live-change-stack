import os from 'os'

import { hashCode, encodeNumber, uidGenerator }from '@live-change/uid'

import setupDbServer from './setupDbServer.js'
import setupDbClient from './setupDbClient.js'

import Debug from 'debug'
const debug = Debug('server:app')

import App from "@live-change/framework"
import Dao from "@live-change/dao"

async function setupApp(settings, env = process.env) {
  const app = App.app()
  app.instanceId = encodeNumber(hashCode(
    `app${process.pid}${os.hostname()} ${process.cwd()}/${process.argv.join(' ')}`))
  app.uidGenerator = uidGenerator(app.instanceId, 1, settings.uidBorders)
  debug("SETUP APP", settings)

  app.databaseName = env.DB_NAME || 'test'

  await setupAppDao(settings)
}

export async function setupAppDao(settings, env = process.env) {
  const app = App.app()
  app.dao = new Dao('app', {})
  if(settings.withDb) {
    await setupDbServer(settings)
  } else {
    await setupDbClient(settings)
  }
}

export default setupApp
