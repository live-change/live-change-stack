import definition from './definition.js'
import { webSubscriptionId } from './webId.js'

/** Browser PushSubscription owned by a user (contact type web). */
export const Web = definition.model({
  name: 'Web',
  properties: {
    endpoint: {
      type: String,
      validation: ['nonEmpty']
    },
    p256dh: {
      type: String,
      validation: ['nonEmpty']
    },
    auth: {
      type: String,
      validation: ['nonEmpty']
    },
    userAgent: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date
    }
  },
  userItem: {
    userReadAccess: () => true,
    userWriteAccess: () => true,
    writableProperties: ['endpoint', 'p256dh', 'auth', 'userAgent', 'createdAt']
  }
})

definition.action({
  name: 'getVapidPublicKey',
  properties: {},
  access: () => true,
  async execute() {
    const { default: config } = await import('./config.js')
    return { vapidPublicKey: config.vapidPublicKey || '' }
  }
})

export { webSubscriptionId }
