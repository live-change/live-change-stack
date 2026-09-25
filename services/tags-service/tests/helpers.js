import App from '@live-change/framework'
const app = App.app()

import { TestServer } from '@live-change/server'

export function createTestAppConfig() {
  return {
    name: 'tags-service-test',
    services: [
      {
        name: 'session',
        createSessionOnUpdate: true
      },
      {
        name: 'tags',
        tagTypes: ['profession'],
        ownerTypes: ['user_User'],
        seedTags: [
          { tagType: 'profession', name: 'dance' }
        ]
      }
    ]
  }
}

export async function startTagsTestServer() {
  const appConfig = createTestAppConfig()
  app.config = appConfig

  const session = (await import('@live-change/session-service')).default
  const tags = (await import('../index.js')).default

  appConfig.services[0].module = session
  appConfig.services[1].module = tags

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
