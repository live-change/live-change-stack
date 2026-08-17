import definition from './definition.js'
import { Email } from './auth.js'
import { buildPlainEmailContent } from './notificationEmailContent.js'

const CONTACT_TYPE = 'email_Email'
const Notification = definition.foreignModel('notification', 'Notification')

async function channelActive(trigger, {
  userId,
  contactId,
  notificationType
}) {
  try {
    return await trigger({ type: 'isNotificationChannelActive' }, {
      userId,
      contactType: CONTACT_TYPE,
      contactId,
      notificationType
    })
  } catch {
    // Prefer fail-open for delivery when preference service is unavailable
    return true
  }
}

async function sendNotificationEmail(trigger, {
  userId,
  notificationId,
  notificationType,
  title,
  message
}) {
  const emails = await Email.indexRangeGet('byUser', [userId], { limit: 32 }) ?? []
  if (!emails.length) return { sent: 0, skipped: 0 }

  let sent = 0
  let skipped = 0

  for (const row of emails) {
    const contactId = row?.id ?? row?.to ?? row?.email
    const address = row?.email || contactId
    if (!contactId || !address) continue

    const active = await channelActive(trigger, {
      userId,
      contactId: String(contactId),
      notificationType
    })
    if (!active) {
      skipped += 1
      continue
    }

    const content = buildPlainEmailContent({
      to: String(address),
      notificationType,
      title,
      message,
      notification: notificationId
    })

    await trigger({ type: 'sendEmailMessage' }, { email: content })
    sent += 1
  }

  if (sent > 0 && notificationId) {
    await trigger({ type: 'markNotificationsEmailed' }, {
      user: userId,
      notifications: [String(notificationId)]
    }).catch(() => {})
  } else if (notificationId && sent === 0 && emails.length) {
    await trigger({ type: 'setNotificationChannelState' }, {
      notification: String(notificationId),
      emailState: 'pending'
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
    if (String(params.sessionOrUserType) !== 'user_User') return { skipped: true, reason: 'not_user' }
    const userId = String(params.sessionOrUser)
    const notificationId = params.notification != null
      ? String(params.notification)
      : null

    if (notificationId) {
      await trigger({ type: 'setNotificationChannelState' }, {
        notification: notificationId,
        emailState: 'pending'
      }).catch(() => {})
    }

    return sendNotificationEmail(trigger, {
      userId,
      notificationId,
      notificationType: String(params.notificationType),
      title: params.title,
      message: params.message
    })
  }
})

definition.trigger({
  name: 'checkEmailNotificationState',
  properties: {
    sessionOrUserType: { type: String, validation: ['nonEmpty'] },
    sessionOrUser: { type: String, validation: ['nonEmpty'] }
  },
  async execute({ sessionOrUserType, sessionOrUser }, { trigger }) {
    if (String(sessionOrUserType) !== 'user_User') {
      return { skipped: true, reason: 'not_user' }
    }
    const userId = String(sessionOrUser)
    const rows = await Notification.indexRangeGet(
      'bySessionOrUser',
      ['user_User', userId],
      { limit: 64, reverse: true }
    ) ?? []

    const pending = rows.filter(row => {
      const state = String(row?.emailState ?? '')
      return state !== 'sent'
    })

    const results = []
    for (const row of pending) {
      const notificationId = row?.id ?? row?.to
      if (!notificationId) continue
      const result = await sendNotificationEmail(trigger, {
        userId,
        notificationId: String(notificationId),
        notificationType: String(row.notificationType ?? 'unknown'),
        title: row.title,
        message: row.message
      })
      results.push({ notification: notificationId, ...result })
    }
    return { count: results.length, results }
  }
})

export { buildPlainEmailContent } from './notificationEmailContent.js'
