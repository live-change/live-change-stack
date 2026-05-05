import path from 'path'
import { fileURLToPath } from 'url'
import App from '@live-change/framework'
import { TestServer } from '@live-change/server'
import { createTestEnvHelpers, waitForServerReady } from '@live-change/e2e-test'
import appConfig from '../server/app.config.js'
import * as services from '../server/services.list.js'

const appRuntime = App.app()
const internalE2EClient = { internal: true, roles: ['admin'] as const }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.join(__dirname, '..', 'server')
const frontDir = path.join(__dirname, '..', 'front')

for (const serviceConfig of appConfig.services) {
  const name = (serviceConfig as { name: string }).name
  ;(serviceConfig as { module?: unknown }).module = (services as Record<string, unknown>)[name]
}
;(appConfig as { init?: (s: unknown) => Promise<void> }).init =
  (services as { init: (s: unknown) => Promise<void> }).init

export type TestEnv = {
  server: InstanceType<typeof TestServer>
  url: string
  haveService: (name: string) => {
    name: string
    models: Record<string, { get: (id: string) => Promise<unknown> }>
    views: Record<string, unknown>
    actions: Record<string, unknown>
    triggers: Record<string, unknown>
  }
  haveModel: (
    serviceName: string,
    modelName: string
  ) => {
    get: (id: string) => Promise<unknown>
    create: (data: unknown) => Promise<unknown>
    update: (id: string, data: unknown) => Promise<unknown>
    delete: (id: string) => Promise<unknown>
    indexObjectGet: (index: string, key: unknown, opts?: unknown) => Promise<unknown>
    indexRangeGet: (index: string, key: unknown) => Promise<unknown[]>
    definition: { properties: Record<string, { preFilter: (v: unknown) => unknown }> }
  }
  haveView: (serviceName: string, viewName: string) => unknown
  haveAction: (serviceName: string, actionName: string) => (data: unknown) => Promise<unknown>
  haveTrigger: (serviceName: string, triggerName: string) => (data: unknown) => Promise<unknown>
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
      haveAction(serviceName: string, actionName: string) {
        const action = helpers.haveAction(serviceName, actionName) as {
          callCommand: (parameters: unknown, clientData: unknown) => Promise<unknown>
        }
        return (parameters: unknown) => {
          const p = parameters as Record<string, unknown> & { _e2eGrantUser?: string }
          const { _e2eGrantUser, ...commandParams } = p
          const client = _e2eGrantUser
            ? { ...internalE2EClient, user: _e2eGrantUser as string }
            : internalE2EClient
          return action.callCommand(commandParams, client).then((res: unknown) => {
            if (typeof res === 'string') return { id: res }
            return res
          })
        }
      },
      haveTrigger(serviceName: string, triggerName: string) {
        return (data: unknown) =>
          appRuntime.triggerService(
            { service: serviceName, type: triggerName, client: internalE2EClient },
            data as Record<string, unknown>
          )
      },
      grabObject: helpers.grabObject
    }
  })()
  return envPromise
}
