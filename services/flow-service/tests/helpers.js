import App from '@live-change/framework'
const app = App.app()

import { TestServer } from '@live-change/server'

export function createTestAppConfig() {
  return {
    name: 'flow-service-test',
    services: [
      {
        name: 'session',
        createSessionOnUpdate: true
      },
      {
        name: 'flow',
        ownerTypes: ['flowTest_TestRecipe'],
        logicTypes: ['flowTest_TestOp'],
        connectionTypes: ['flowTest_TestWire']
      },
      {
        name: 'flowTest'
      }
    ]
  }
}

export async function startFlowTestServer() {
  const appConfig = createTestAppConfig()
  // createServiceDefinition copies app.config.services at import time.
  app.config = appConfig

  const session = (await import('@live-change/session-service')).default
  const flow = (await import('../index.js')).default
  const flowTest = (await import('./fixture/index.js')).default

  appConfig.services[0].module = session
  appConfig.services[1].module = flow
  appConfig.services[2].module = flowTest

  const server = new TestServer({
    services: appConfig,
    withSsr: false,
    enableSessions: true,
    port: 0
  })
  await server.start()
  return server
}

export async function trigger(app, serviceName, type, data) {
  return await app.triggerService(
    { service: serviceName, type, client: { internal: true } },
    data
  )
}
