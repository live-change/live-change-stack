#!/usr/bin/env node
import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import path from 'path'
import http from 'http'
import fs from 'fs'
import yargs from 'yargs'

import { createProxyMiddleware } from 'http-proxy-middleware'
import { readFile } from 'fs/promises'
import App from '@live-change/framework'
const app = App.app()

import {

  SsrServer,
  Services,

  createLoopbackDao,
  setupApiServer,
  setupApiSockJs,
  setupApiWs,
  setupApp,
  setupApiEndpoints

} from "@live-change/server"

import { DaoCache } from '@live-change/dao'

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

process.on('uncaughtException', function (err) {
  console.error(err.stack)
})

let argsDefaults = {
  apiHost: process.env.API_SERVER_HOST || '0.0.0.0',
  apiPort: process.env.API_SERVER_PORT || 8002,

  ssrHost: process.env.SSR_SERVER_HOST || '0.0.0.0',
  ssrPort: process.env.SSR_SERVER_PORT || 8001,

  sessionCookieDomain: process.env.SESSION_COOKIE_DOMAIN
}

export function startOptions(yargs) {
  yargs.option('withServices', {
    type: 'boolean',
    description: 'start all services'
  })
  yargs.options('updateServices', {
    type: 'boolean',
    description: 'update all services'
  })
  yargs.option('withDb', {
    type: 'boolean',
    description: 'start local database'
  })
  yargs.option('dbBackend', {
    type: 'string',
    description: 'select db backend engine ( lmdb | leveldb | rocksdb | memdown | mem )',
    default: 'lmdb'
  })
  yargs.option('dbBackendUrl', {
    type: 'string',
    description: 'database backend url parameter'
  })
  yargs.option('dbRoot', {
    type: 'string',
    description: 'database root directory',
    default: 'tmp.db'
  })
  yargs.option('createDb', {
    type: 'boolean',
    description: 'create database if not exists'
  })
  yargs.option('dbAccess', {
    type: 'boolean',
    description: 'give database access to frontend(only for development and db-admin)'
  })
}

export function apiServerOptions(yargs) {
  yargs.option('apiPort', {
    describe: 'api server port',
    type: 'number',
    default: argsDefaults.apiPort
  })
  yargs.option('apiHost', {
    describe: 'api server bind host',
    type: 'string',
    default: argsDefaults.apiHost
  })
  yargs.option('services', {
    describe: 'services config',
    type: 'string',
    default: 'server/services.config.js'
  })
  yargs.option('initScript', {
    description: 'run init script',
    type: 'string'
  })
}

export function ssrServerOptions(yargs) {
  yargs.option('ssrRoot', {
    describe: 'frontend root directory',
    type: 'string',
    default: './front'
  })
  yargs.option('ssrPort', {
    describe: 'port to bind on',
    type: 'number',
    default: argsDefaults.ssrPort
  })
  yargs.option('ssrHost', {
    describe: 'bind host',
    type: 'string',
    default: argsDefaults.ssrHost
  })
  yargs.option('withApi', {
    describe: 'start internal api server',
    type: 'boolean'
  })
  yargs.option('serverEntry', {
    describe: 'front ssr entry file',
    type: 'string'
  })
  yargs.option('templatePath', {
    describe: 'front ssr entry file',
    type: 'string'
  })
  yargs.option('version', {
    describe: 'server version',
    type: 'string'
  })
  yargs.option('versionFile', {
    describe: 'server version file',
    type: 'string'
  })
  yargs.option('plugin', {
    describe: 'start in plugin mode - without ssr, and with vite mode plugin',
    type: 'boolean'
  })
  yargs.option('mode', {
    describe: 'vite mode',
    type: 'string'
  })
  yargs.option('sessionCookieExpire', {
    describe: 'time in seconds for session cookie to expire',
    type: 'number',
  })
  yargs.option('sessionCookieDomain', {
    describe: 'domain for session cookie',
    type: 'string',
    default: argsDefaults.sessionCookieDomain
  })
}

let globalServicesConfig

export default function starter(servicesConfig = null, args = {}) {
  argsDefaults = { ...argsDefaults, ...args }
  globalServicesConfig = servicesConfig
  yargs(process.argv.slice(2))
    .command('apiServer', 'start server', (yargs) => {
      apiServerOptions(yargs)
      startOptions(yargs)
    }, async (argv) => {
      await setupApp({...argv, uidBorders: '[]'})
      await apiServer(argv)
    })
    .command('devApiServer', 'shortcut for apiServer --withServices --updateServices', (yargs) => {
      apiServerOptions(yargs)
      startOptions(yargs)
    }, async (argv) => {
      argv = {
        ...argv,
        withServices: true, updateServices: true
      }
      await setupApp({...argv, uidBorders: '[]'})
      await apiServer(argv)
    })
    .command('memApiServer', 'shortcut for devApiServer --withDb --dbBackend mem --createDb', (yargs) => {
      apiServerOptions(yargs)
      startOptions(yargs)
    }, async (argv) => {
      argv = {
        ...argv,
        withApi: true, withServices: true, updateServices: true,
        withDb: true, dbBackend: 'mem', createDb: true
      }
      await setupApp({...argv, uidBorders: '[]'})
      await apiServer(argv)
    })
    .command('ssrServer', 'start ssr server', (yargs) => {
      ssrServerOptions(yargs)
      apiServerOptions(yargs)
      startOptions(yargs)
    }, async (argv) => {
      await setupApp({...argv, uidBorders: '[]'})
      await server({...argv, uidBorders: '[]'}, false)
    })
    .command('server', 'start server', (yargs) => {
      ssrServerOptions(yargs)
      apiServerOptions(yargs)
      startOptions(yargs)
    }, async (argv) => {
      await setupApp({...argv, uidBorders: '[]'})
      await server({...argv, uidBorders: '[]'}, false)
    })
    .command('ssrDev', 'start ssr server in development mode', (yargs) => {
      ssrServerOptions(yargs)
      apiServerOptions(yargs)
      startOptions(yargs)
    }, async (argv) => {
      await setupApp({...argv, uidBorders: '[]'})
      await server({...argv, uidBorders: '[]'}, true)
    })
    .command('dev', 'shortcut for ssrDev --withApi --withServices --updateServices --createDb', (yargs) => {
      ssrServerOptions(yargs)
      apiServerOptions(yargs)
      startOptions(yargs)
    }, async (argv) => {
      argv = {
        ...argv,
        withApi: true, withServices: true, updateServices: true, createDb: true,
      }
      await setupApp({...argv, uidBorders: '[]'})
      await server({...argv, uidBorders: '[]'}, true)
    })
    .command('memDev', 'shortcut for dev --withDb --dbBackend mem --createDb', (yargs) => {
      ssrServerOptions(yargs)
      apiServerOptions(yargs)
      startOptions(yargs)
    }, async (argv) => {
      argv = {
        ...argv,
        withApi: true, withServices: true, updateServices: true,
        withDb: true, dbBackend: 'mem', createDb: true
      }
      await setupApp({...argv, uidBorders: '[]'})
      await server({...argv, uidBorders: '[]'}, true)
    })
    .command('localDev', 'shortcut for dev --withDb --createDb', (yargs) => {
      ssrServerOptions(yargs)
      apiServerOptions(yargs)
      startOptions(yargs)
    }, async (argv) => {
      argv = {
        ...argv,
        withApi: true, withServices: true, updateServices: true,
        withDb: true, createDb: true
      }
      await setupApp({...argv, uidBorders: '[]'})
      await server({...argv, uidBorders: '[]'}, true)
    })
    .command('describe', 'describe server', (yargs) => {
      yargs.option('service', {
        describe: 'service that will be described',
        type: 'string',
        default: '*'
      })
      yargs.option('json', {
        describe: 'print json',
        type: 'boolean'
      })
    }, async (argv) => {
      await describe(argv)
    })
    .command('changes', 'show changes', (yargs) => {
      yargs.option('service', {
        describe: 'service that will be described',
        type: 'string',
        default: '*'
      })
    }, async (argv) => {
      await setupApp({...argv, uidBorders: '[]'})
      await changes(argv)
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    }).argv
  /// TODO api.gen.js generation command
}

export async function changes(argv) {
  if(globalServicesConfig) argv.services = globalServicesConfig
  const services = new Services(argv.services)
  await services.loadServices()
  await services.processDefinitions()
  async function printChanges(service) {
    const oldServiceJson = app.getOldServiceDefinition(service.name)
    const changes = service.computeChanges(oldServiceJson)
    console.log("Service", service.name)
    for(const change of changes) {
      console.log(JSON.stringify(change, null, "  "))
    }
  }
  if(argv.service === '*') {
    for(const service of services.serviceDefinitions) {
      await printChanges(service)
    }
  } else {
    const service = services.serviceDefinitions.find(s => s.name === argv.service)
    if(service) {
      await printChanges(service)
    } else {
      console.error("Service", argv.service, "not found")
    }
  }
  process.exit(0)
}

export async function describe(argv) {
  if(globalServicesConfig) argv.services = globalServicesConfig
  const services = new Services(argv.services)
  await services.loadServices()
  await services.processDefinitions()
  function describeService(service) {
    console.log("Service", service.name)
    if(argv.json) {
      console.log(JSON.stringify(service.toJSON(), null, "  "))
      return
    }
    console.log("  models:")
    for(const modelName in service.models) {
      const model = service.models[modelName]
      const properties = Object.keys(model.properties ?? {})
      console.log("    ", modelName, "(", properties.join(', '), ")")
      for(const indexName in model.indexes) {
        const index = model.indexes[indexName]
        console.log("      ", indexName)
      }
    }
    console.log("  indexes:")
    for(const indexName in service.indexes) {
      const index = service.indexes[indexName]
      console.log("    ", indexName)
    }
    console.log("  actions:")
    for(const actionName in service.actions) {
      const action = service.actions[actionName]
      const properties = Object.keys(action.properties ?? {})
      console.log("    ", actionName, "(", properties.join(', '), ")")
    }
    console.log("  views:")
    for(const viewName in service.views) {
      const view = service.views[viewName]
      const properties = Object.keys(view.properties ?? {})
      console.log("    ", viewName, "(", properties.join(', '), ")",
          view.global ? "global" : "", view.internal ? "internal" : "", view.remote ? "remote" : "")
    }
    console.log("  triggers:")
    for(const triggerName in service.triggers) {
      const triggers = service.triggers[triggerName]
      for(const trigger of triggers) {
        const properties = Object.keys(trigger.properties ?? {})
        console.log("    ", triggerName, "(", properties.join(', '), ")")
      }
    }
    console.log("  events:")
    for(const eventName in service.events) {
      const event = service.events[eventName]
      const properties = Object.keys(event.properties ?? {})
      console.log("    ", eventName, "(", properties.join(', '), ")")
    }
  }
  if(argv.service === '*') {
    for(const service of services.serviceDefinitions) {
      describeService(service)
    }
  } else {
    const service = services.serviceDefinitions.find(s => s.name === argv.service)
    if(service) {
      describeService(service)
    } else {
      console.error("Service", argv.service, "not found")
    }
  }
  process.exit(0)
}

export async function apiServer(argv) {
  if(globalServicesConfig) argv.services = globalServicesConfig

  const { apiPort, apiHost } = argv

  const apiServer = await setupApiServer(argv)

  const expressApp = express()

  await setupApiEndpoints(expressApp, apiServer)

  const httpServer = http.createServer(expressApp)

  setupApiWs(httpServer, apiServer)
  setupApiSockJs(httpServer, apiServer)

  httpServer.listen(apiPort, apiHost)
  console.log('Listening on port ' + apiPort)
}

export async function server(argv, dev) {

  if(globalServicesConfig) argv.services = globalServicesConfig

  const { ssrRoot, ssrPort, ssrHost, apiHost, apiPort } = argv

  const fastAuth = true

  const expressApp = express()

  //expressApp.use('/static', express.static(path.resolve(ssrRoot, 'public')))

  const manifest = (dev || argv.spa)
      ? null
      : JSON.parse(fs.readFileSync((path.resolve(ssrRoot, 'dist/client/.vite/ssr-manifest.json'))))

  if(!argv.version) argv.version = process.env.VERSION
  if(argv.versionFile) argv.version = await readFile(argv.versionFile, 'utf8')

  if(!argv.withApi) {
    const apiServerHost = (argv.apiHost === '0.0.0.0' ? 'localhost' : argv.apiHost) + ':' + argv.apiPort
    const target = `http://${apiServerHost}/`
    const apiProxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true
    })
    expressApp.use('/api', apiProxy)
    console.log("PROXY /api to", target)
  }

  let apiServer
  if(argv.withApi) {
    apiServer = await setupApiServer({ ...argv, fastAuth })
    await setupApiEndpoints(expressApp, apiServer)
  }

  if(argv.appCache || process.env.APP_CACHE === "YES") app.dao = new DaoCache(app.dao)

  console.log("ENDPOINTS INSTALLED! CREATING WEB SERVER!")

  const ssrServer = new SsrServer(expressApp, manifest, {
    ...argv,
    dev,
    fastAuth,
    root: ssrRoot || '.',
    ...(apiServer
            ? {
              daoFactory: async (credentials, ip) => {
                return await createLoopbackDao(credentials, () => apiServer.daoFactory(credentials, ip))
              }
            }
            : {
              apiHost, apiPort
            }
    )
  })
  await ssrServer.start()

  console.log("SSR INSTALLED! CREATING HTTP SERVER!")

  const httpServer = http.createServer(expressApp)
  if(argv.withApi) {
    setupApiWs(httpServer, apiServer)
    setupApiSockJs(httpServer, apiServer)
  }

  console.log("HTTP SERVER CREATED! INSTALLING!")

  httpServer.listen(ssrPort, ssrHost)

  console.log("LISTENING ON ",`${ssrHost}:${ssrPort} link: http://${ssrHost}:${ssrPort}/`)
}