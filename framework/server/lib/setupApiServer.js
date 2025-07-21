import Dao from "@live-change/dao"
import Services from '../lib/Services.js'
import App from "@live-change/framework"
const app = App.app()
import * as DaoWebsocket from "@live-change/dao-websocket"

async function setupApiServer(settings) {
  const { services: config, withServices, updateServices } = settings

  if(settings.createDb) {
    const list = await app.dao.get(['database', 'databasesList'])
    console.log("existing databases:", list.join(', '))
    console.log("creating database", app.databaseName)

    await app.dao.request(['database', 'createDatabase'], app.databaseName, {
      storage: { noMetaSync: true, noSync: true }
    }).catch(err => 'exists')
  }

  const services = new Services(config)

  await services.loadServices()

  if(updateServices) await services.update()
  await services.start(withServices
      ? { runCommands: true, handleEvents: true, indexSearch: true, stopped: settings.stopped }
      : { runCommands: false, handleEvents: false, indexSearch: false, stopped: true })

  if(settings.initScript) {
    if(config.init) {
      config.init(await services.getServicesObject())
    } else {
      const initScript = await import(await services.resolve(settings.initScript))
      await (initScript.default || initScript)(await services.getServicesObject())
    }
  }

  const apiServerConfig = {
    services: services.services,
    clientConfig: config.clientConfig,
    //local, remote, <-- everything from services
    local(credentials) {
      const local = {
        version: new Dao.SimpleDao({
          values: {
            version: {
              observable() {
                return new Dao.ObservableValue(settings.version || process.env.VERSION)
              },
              async get() {
                return settings.version || process.env.VERSION
              }
            }
          }
        }),
        ...(typeof services.config.local === 'function' ? services.config.local(credentials) : services.config.local)
      }
      if(settings.dbAccess) {
        local.serverDatabase = {
          observable(what) {
            return app.dao.observable(['database', ...what.slice(1)])
          },
          get(what) {
            return app.dao.get(['database', ...what.slice(1)])
          },
          request(what, ...args) {
            return app.dao.request(['database', ...what.slice(1)], ...args)
          }
        }
      }
      return local
    },
    remote(credentials) {
      return {
        ...(typeof services.config.remote === 'function' ? services.config.remote(credentials) : services.config.remote)
      }
    },
    protocols: {
      'ws': DaoWebsocket.client,
      ...(services.config.protocols)
    },
    shareDefinition: true,
    logErrors: true,
    createSessionOnUpdate: true, /// deprecated - moved to session-service settings
    fastAuth: settings.fastAuth
  }

  const apiServer = await app.createLiveApiServer(apiServerConfig)

  const internalCredentials = { internal: true, roles: ['admin'] }

  if(settings.withServices) {
    const localServer = new Dao.ReactiveServer(
        () => app.createDao(apiServerConfig, { ...internalCredentials, ignoreRemoteView: true })
    )
    const loopback = new Dao.LoopbackConnection('local', localServer, {})
    const localConfig = {
      type: 'remote',
      generator: Dao.ObservableList,
      protocol: 'local',
      url: 'services'
    }
    app.dao.definition = {
      ...app.dao.definition,
      protocols: { ...app.dao.definition.protocols, local: null },
      ...(typeof services.config.local === 'function' ? services.config.local(internalCredentials) : services.config.local),
      ...(typeof services.config.remote === 'function' ? services.config.remote(internalCredentials) : services.config.remote)
    }
    for(const service of services.services) {
      app.dao.definition[service.name] = localConfig
    }
    app.dao.connections.set('local:services', loopback)
    await loopback.initialize()
    if(!loopback.connected) {
      console.error("LOOPBACK NOT CONNECTED?!")
      process.exit(1)
    }
  } else {
    throw new Error("remote services not implemented")
  }

  apiServer.services = services

  return apiServer
}

export default setupApiServer
