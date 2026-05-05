import path from 'path'
import { fileURLToPath } from 'url'
import { TestServer } from '@live-change/server'
import { createTestEnvHelpers, waitForServerReady } from '@live-change/e2e-test'
import appConfig from '../server/app.config.js'
import * as services from '../server/services.list.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.join(__dirname, '..', 'server')
const frontDir = path.join(__dirname, '..', 'front')

for (const serviceConfig of appConfig.services) {
  const name = (serviceConfig as { name: string }).name
  ;(serviceConfig as { module?: unknown }).module = (services as Record<string, unknown>)[name]
}
const codemirrorService = appConfig.services.find((s: { name: string }) => s.name === 'codemirror') as
  { testLatency?: number } | undefined
if (codemirrorService) codemirrorService.testLatency = 0
;(appConfig as { init?: (s: unknown) => Promise<void> }).init =
  (services as { init: (s: unknown) => Promise<void> }).init

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
  if (!s) return
  testServer = null
  envPromise = null
  await s.dispose()
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
    const helpers = createTestEnvHelpers(server)
    return {
      server,
      url,
      haveService: helpers.haveService,
      haveModel: helpers.haveModel,
      haveView: helpers.haveView,
      haveAction: helpers.haveAction,
      haveTrigger: helpers.haveTrigger,
      grabObject: helpers.grabObject
    }
  })()
  return envPromise
}
