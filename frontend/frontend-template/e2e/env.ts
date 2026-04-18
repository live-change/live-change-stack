import path from 'path'
import { fileURLToPath } from 'url'
import { TestServer } from '@live-change/server'
import appConfig from '../server/app.config.js'
import * as services from '../server/services.list.js'

const READY_TIMEOUT_MS = 60000
const READY_POLL_MS = 2000

async function waitForServerReady(url: string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, READY_POLL_MS))
  }
  throw new Error(`Server at ${url} did not become ready within ${READY_TIMEOUT_MS}ms`)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.join(__dirname, '..', 'server')
const frontDir = path.join(__dirname, '..', 'front')

for (const serviceConfig of appConfig.services) {
  const name = (serviceConfig as { name: string }).name
  ;(serviceConfig as { module?: unknown }).module = (services as Record<string, unknown>)[name]
}
;(appConfig as { init?: (s: unknown) => Promise<void> }).init = (services as { init: (s: unknown) => Promise<void> }).init

export type TestEnv = {
  server: InstanceType<typeof TestServer>
  url: string
  haveService: (name: string) => { name: string; models: Record<string, { get: (id: string) => Promise<unknown> }>; views: Record<string, unknown>; actions: Record<string, unknown>; triggers: Record<string, unknown> }
  haveModel: (serviceName: string, modelName: string) => { get: (id: string) => Promise<unknown>; create: (data: unknown) => Promise<unknown>; update: (id: string, data: unknown) => Promise<unknown>; delete: (id: string) => Promise<unknown>; indexObjectGet: (index: string, key: unknown, opts?: unknown) => Promise<unknown>; indexRangeGet: (index: string, key: unknown) => Promise<unknown[]>; definition: { properties: Record<string, { preFilter: (v: unknown) => unknown }> } }
  haveView: (serviceName: string, viewName: string) => unknown
  haveAction: (serviceName: string, actionName: string) => unknown
  haveTrigger: (serviceName: string, triggerName: string) => unknown
  grabObject: (serviceName: string, modelName: string, id: string) => Promise<unknown>
}

type TestServerInstance = InstanceType<typeof TestServer>

let envPromise: Promise<TestEnv> | null = null
let testServer: TestServerInstance | null = null

export async function disposeTestEnv(): Promise<void> {
  const s = testServer
  testServer = null
  envPromise = null
  if (s) await s.dispose()
}

function haveService(server: TestServerInstance, name: string) {
  const service = server.apiServer.services.services.find((s: { name: string }) => s.name === name)
  if (!service) throw new Error('service ' + name + ' not found')
  return service
}

function haveModel(server: TestServerInstance, serviceName: string, modelName: string) {
  const service = haveService(server, serviceName)
  const model = service.models[modelName]
  if (!model) throw new Error('model ' + modelName + ' not found')
  return model
}

export async function getTestEnv(): Promise<TestEnv> {
  if (envPromise) return envPromise
  envPromise = (async () => {
    const server = new TestServer({
      dev: true,
      enableSessions: true,
      port: 0,
      ssrRoot: frontDir,
      initScript: path.join(serverDir, 'init.js'),
      services: appConfig
    })
    console.log('starting test server')
    try {
      await server.start()
    } catch (error) {
      console.error((error as Error).stack)
      process.exit(1)
    }
    console.log('Test server started at', server.url)
    console.log('waiting for front to be ready...')
    await waitForServerReady(server.url!)
    console.log('front ready')

    testServer = server

    process.on('beforeExit', () => {
      void disposeTestEnv()
    })

    const url = server.url!
    return {
      server,
      url,
      haveService: (name: string) => haveService(server, name),
      haveModel: (serviceName: string, modelName: string) => haveModel(server, serviceName, modelName),
      haveView: (serviceName: string, viewName: string) => {
        const service = haveService(server, serviceName)
        const view = service.views[viewName]
        if (!view) throw new Error('view ' + viewName + ' not found')
        return view
      },
      haveAction: (serviceName: string, actionName: string) => {
        const service = haveService(server, serviceName)
        const action = service.actions[actionName]
        if (!action) throw new Error('action ' + actionName + ' not found')
        return action
      },
      haveTrigger: (serviceName: string, triggerName: string) => {
        const service = haveService(server, serviceName)
        const trigger = service.triggers[triggerName]
        if (!trigger) throw new Error('trigger ' + triggerName + ' not found')
        return trigger
      },
      grabObject: async (serviceName: string, modelName: string, id: string) => {
        const model = haveModel(server, serviceName, modelName)
        return await model.get(id)
      }
    }
  })()
  return envPromise
}
