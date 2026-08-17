import definition from './definition.js'
import config from './config.js'
import { Web } from './web.js'
import { buildWebPushPayload } from './notificationPayload.js'
import webpush from 'web-push'

const CONTACT_TYPE = 'web_Web'

function ensureVapid() {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    throw new Error('vapid_keys_not_configured')
  }
  webpush.setVapidDetails(
    config.vapidSubject || 'mailto:admin@example.com',
    config.vapidPublicKey,
    config.vapidPrivateKey
  )
}

definition.trigger({
  name: 'sendWebPushMessage',
  properties: {
    web: { type: String },
    subscription: { type: Object },
    title: { type: String },
    body: { type: String },
    data: { type: Object }
  },
  async execute({ web, subscription, title, body, data }) {
    let sub = subscription
    if (!sub && web) {
      const row = await Web.get(web)
      if (!row) throw new Error('web_subscription_not_found')
      sub = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth }
      }
    }
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      throw new Error('subscription_required')
    }

    ensureVapid()
    const payload = JSON.stringify({
      title: title || 'Notification',
      body: body || '',
      data: data || {}
    })

    try {
      await webpush.sendNotification(sub, payload)
      return { sent: true, endpoint: sub.endpoint }
    } catch (err) {
      const statusCode = err?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        // Gone — drop subscription
        const id = web || null
        if (id) {
          await Web.delete(id).catch(() => {})
        }
      }
      throw err
    }
  }
})

async function channelActive(trigger, { userId, contactId, notificationType }) {
  try {
    return await trigger({ type: 'isNotificationChannelActive' }, {
      userId,
      contactType: CONTACT_TYPE,
      contactId,
      notificationType
    })
  } catch {
    return true
  }
}

async function sendNotificationWebPush(trigger, {
  userId,
  notificationId,
  notificationType,
  title,
  message,
  data
}) {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    return { sent: 0, skipped: 0, reason: 'vapid_not_configured' }
  }

  const rows = await Web.indexRangeGet('byUser', [userId], { limit: 32 }) ?? []
  if (!rows.length) return { sent: 0, skipped: 0 }

  const payload = buildWebPushPayload({
    notificationType,
    title,
    message,
    notification: notificationId,
    data
  })

  let sent = 0
  let skipped = 0

  for (const row of rows) {
    const contactId = row?.id ?? row?.to
    if (!contactId) continue
    const active = await channelActive(trigger, {
      userId,
      contactId: String(contactId),
      notificationType
    })
    if (!active) {
      skipped += 1
      continue
    }
    try {
      await trigger({ type: 'sendWebPushMessage' }, {
        web: String(contactId),
        title: payload.title,
        body: payload.body,
        data: payload.data
      })
      sent += 1
    } catch (err) {
      console.error('[web] push failed', contactId, err?.message ?? err)
    }
  }

  if (sent > 0 && notificationId) {
    await trigger({ type: 'markNotificationsWebPushed' }, {
      user: userId,
      notifications: [String(notificationId)]
    }).catch(() => {})
  } else if (notificationId) {
    await trigger({ type: 'setNotificationChannelState' }, {
      notification: String(notificationId),
      webPushState: sent === 0 ? 'pending' : undefined
    }).catch(() => {})
  }

  return { sent, skipped }
}

definition.trigger({
  name: 'notificationCreated',
  properties: {
    notification: { type: String },
    sessionOrUserType: { type: String, validation: ['nonEmpty'] },
    sessionOrUser: { type: String, validation: ['nonEmpty'] },
    notificationType: { type: String, validation: ['nonEmpty'] },
    title: { type: String },
    message: { type: String },
    time: { type: Date }
  },
  async execute(params, { trigger }) {
    if (String(params.sessionOrUserType) !== 'user_User') {
      return { skipped: true, reason: 'not_user' }
    }
    const notificationId = params.notification != null ? String(params.notification) : null
    if (notificationId) {
      await trigger({ type: 'setNotificationChannelState' }, {
        notification: notificationId,
        webPushState: 'pending'
      }).catch(() => {})
    }
    return sendNotificationWebPush(trigger, {
      userId: String(params.sessionOrUser),
      notificationId,
      notificationType: String(params.notificationType),
      title: params.title,
      message: params.message
    })
  }
})
