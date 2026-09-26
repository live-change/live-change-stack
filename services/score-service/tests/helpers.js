import App from '@live-change/framework'
const app = App.app()

import { TestServer } from '@live-change/server'

export function createTestAppConfig() {
  return {
    name: 'score-service-test',
    services: [
      {
        name: 'session',
        createSessionOnUpdate: true
      },
      {
        name: 'scoreTest'
      },
      {
        name: 'score',
        recipientTypes: ['user_User'],
        causeTypes: {
          scoreTest_ProfileUnlock: { category: 'profile', score: 10 },
          scoreTest_Invite: { category: 'invite', score: 30 },
          scoreTest_Bonus: { category: 'invite', score: 20 }
        },
        counters: {
          total: { categories: ['profile', 'invite', 'achievement'], ranked: true },
          profile: { categories: ['profile'], ranked: false }
        }
      }
    ]
  }
}

export async function startScoreTestServer() {
  const appConfig = createTestAppConfig()
  app.config = appConfig

  const session = (await import('@live-change/session-service')).default
  const scoreTest = (await import('./fixture/index.js')).default
  const score = (await import('../index.js')).default

  appConfig.services[0].module = session
  appConfig.services[1].module = scoreTest
  appConfig.services[2].module = score

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
