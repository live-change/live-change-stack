import definition from './definition.js'
import { Web } from './web.js'
import { webSubscriptionId } from './webId.js'

definition.event({
  name: 'webSubscribed',
  async execute({ web, data }) {
    const existing = await Web.get(web)
    if (existing) {
      await Web.update(web, data)
    } else {
      await Web.create({ id: web, ...data })
    }
  }
})

definition.event({
  name: 'webUnsubscribed',
  async execute({ web }) {
    await Web.delete(web)
  }
})

// Override subscribe/unsubscribe to use local events (reliable ids)
definition.action({
  name: 'subscribeWebPush',
  properties: {
    endpoint: { type: String, validation: ['nonEmpty'] },
    p256dh: { type: String, validation: ['nonEmpty'] },
    auth: { type: String, validation: ['nonEmpty'] },
    userAgent: { type: String }
  },
  access: (params, { client }) => Boolean(client?.user),
  async execute({ endpoint, p256dh, auth, userAgent }, { client }, emit) {
    const id = webSubscriptionId(endpoint)
    emit({
      type: 'webSubscribed',
      web: id,
      data: {
        user: client.user,
        endpoint,
        p256dh,
        auth,
        userAgent: userAgent ?? '',
        createdAt: new Date()
      }
    })
    return { web: id }
  }
})

definition.action({
  name: 'unsubscribeWebPush',
  properties: {
    endpoint: { type: String },
    web: { type: String }
  },
  access: (params, { client }) => Boolean(client?.user),
  async execute({ endpoint, web }, { client }, emit) {
    const id = web || (endpoint ? webSubscriptionId(endpoint) : null)
    if (!id) throw new Error('web_or_endpoint_required')
    const row = await Web.get(id)
    if (!row || row.user !== client.user) throw new Error('not_found')
    emit({ type: 'webUnsubscribed', web: id })
    return { web: id, deleted: true }
  }
})
