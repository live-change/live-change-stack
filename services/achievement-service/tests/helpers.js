import App from '@live-change/framework'
const app = App.app()

import { TestServer } from '@live-change/server'

export function createTestAppConfig() {
  return {
    name: 'achievement-service-test',
    services: [
      {
        name: 'session',
        createSessionOnUpdate: true
      },
      {
        name: 'score',
        recipientTypes: ['user_User'],
        causeTypes: {
          achievement_Unlock: { category: 'achievement', scoreProperty: 'score' }
        },
        counters: {
          total: { categories: ['achievement'], ranked: true }
        }
      },
      {
        name: 'achievement',
        recipientTypes: ['user_User'],
        achievements: {
          'profile-name': {
            metric: 'profile-name',
            threshold: 1,
            score: 10,
            category: 'profile',
            priority: 10
          },
          'invites-1': {
            metric: 'invites',
            threshold: 1,
            score: 5,
            category: 'invite',
            priority: 20
          },
          'invites-5': {
            metric: 'invites',
            threshold: 5,
            score: 25,
            category: 'invite',
            priority: 30
          }
        }
      }
    ]
  }
}

export async function startAchievementTestServer() {
  const appConfig = createTestAppConfig()
  app.config = appConfig

  const session = (await import('@live-change/session-service')).default
  const score = (await import('@live-change/score-service')).default
  const achievement = (await import('../index.js')).default

  appConfig.services[0].module = session
  appConfig.services[1].module = score
  appConfig.services[2].module = achievement

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
